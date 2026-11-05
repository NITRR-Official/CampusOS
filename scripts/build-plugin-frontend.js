/**
 * Standalone Plugin Frontend ESM Bundler (ADR-014 / Issue #118)
 * Compiles a plugin's frontend into a self-contained, browser-executable ES module
 * with externalized React and CampusOS shared libraries.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGINS_DIR = path.resolve(__dirname, '../plugins');

/**
 * Discovers the frontend entrypoint for a plugin.
 */
function findFrontendEntrypoint(pluginDir) {
  const frontendDir = path.join(pluginDir, 'frontend');
  if (!fs.existsSync(frontendDir)) return null;

  const candidateRelativePaths = [
    'index.ts',
    'index.tsx',
    'index.js',
    'index.jsx',
    'init.ts',
    'init.tsx',
    'page.tsx',
    'pages/index.tsx',
    'App.tsx',
    'App.jsx'
  ];

  for (const rel of candidateRelativePaths) {
    const candidate = path.join(frontendDir, rel);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  // Fallback: search for first .tsx or .ts file in frontend root
  const files = fs.readdirSync(frontendDir);
  const tsxFile = files.find(
    (f) => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.endsWith('.d.ts')
  );
  if (tsxFile) {
    return path.join(frontendDir, tsxFile);
  }

  return null;
}

/**
 * esbuild plugin to shim host-provided shared modules (@campusos/design-system and @campus-os/shared)
 * to window.__CampusOS_Runtime__ without bundling duplicate dependencies or emitting unresolvable bare specifiers (Issue #131).
 */
const hostVirtualModulesPlugin = {
  name: 'campusos-host-virtual-modules',
  setup(build) {
    // Intercept @campusos/design-system and its subpaths
    build.onResolve(
      { filter: /^@campusos\/design-system(\/.*)?$/ },
      (args) => ({
        path: args.path,
        namespace: 'campusos-ui-virtual'
      })
    );

    build.onLoad({ filter: /.*/, namespace: 'campusos-ui-virtual' }, () => ({
      contents: `
        const runtime = (typeof window !== 'undefined' && (window.CampusOS || window.__CampusOS_Runtime__)) || {};
        const ui = runtime.ui || (typeof window !== 'undefined' && window.__CampusOS_DesignSystem__) || {};
        
        export const {
          Avatar, AvatarImage, AvatarFallback,
          Badge, badgeVariants,
          Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis,
          Button, buttonVariants,
          Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent,
          Checkbox,
          Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
          DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup,
          Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField, useFormField,
          Input,
          Label,
          ScrollArea, ScrollBar,
          Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton,
          Separator,
          Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
          Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar,
          Skeleton,
          Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption,
          Textarea,
          Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose, ToastAction,
          Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
          cn, useToast, toast
        } = ui;
        
        export default ui;
      `,
      loader: 'js'
    }));

    // Intercept @campus-os/shared
    build.onResolve({ filter: /^@campus-os\/shared(\/.*)?$/ }, (args) => ({
      path: args.path,
      namespace: 'campusos-shared-virtual'
    }));

    build.onLoad(
      { filter: /.*/, namespace: 'campusos-shared-virtual' },
      () => ({
        contents: `
        const runtime = (typeof window !== 'undefined' && (window.CampusOS || window.__CampusOS_Runtime__)) || {};
        export const registry = runtime.registry || (typeof window !== 'undefined' && window.CampusOS?.registry);
        export const ExtensionPoint = runtime.ExtensionPoint || (typeof window !== 'undefined' && window.CampusOS?.ExtensionPoint);
        export default { registry, ExtensionPoint };
      `,
        loader: 'js'
      })
    );
  }
};

/**
 * Builds a standalone frontend ESM bundle for a specified plugin.
 *
 * @param {string} pluginName - Name of plugin in /plugins/
 * @param {object} [options]
 * @param {boolean} [options.minify=false]
 * @param {boolean} [options.sourcemap=true]
 * @param {string} [options.pluginsDir]
 * @returns {Promise<{ outfile: string, sizeBytes: number }>}
 */
export async function buildPluginFrontend(pluginName, options = {}) {
  const pluginsDir = options.pluginsDir || PLUGINS_DIR;
  const pluginDir = path.join(pluginsDir, pluginName);

  if (!fs.existsSync(pluginDir)) {
    throw new Error(`Plugin directory not found: ${pluginDir}`);
  }

  const entryPoint = findFrontendEntrypoint(pluginDir);
  if (!entryPoint) {
    throw new Error(
      `No frontend entrypoint found in '${path.join(pluginDir, 'frontend')}'. Expected index.ts, init.ts, page.tsx, or App.tsx.`
    );
  }

  const distDir = path.join(pluginDir, 'frontend', 'dist');
  fs.mkdirSync(distDir, { recursive: true });

  const outfile = path.join(distDir, 'bundle.esm.js');

  await esbuild.build({
    entryPoints: [entryPoint],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    jsx: 'automatic',
    plugins: [hostVirtualModulesPlugin],
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx',
      '.js': 'js',
      '.jsx': 'jsx',
      '.css': 'css'
    },
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    banner: {
      js: 'const React = window.React || (window.__CampusOS_Runtime__ && window.__CampusOS_Runtime__.React); const ReactDOM = window.ReactDOM || (window.__CampusOS_Runtime__ && window.__CampusOS_Runtime__.ReactDOM);'
    },
    sourcemap: options.sourcemap !== false,
    minify: Boolean(options.minify)
  });

  const stat = fs.statSync(outfile);
  return {
    outfile,
    sizeBytes: stat.size
  };
}

// CLI runner
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const pluginName = process.argv[2];
  const isMinify = process.argv.includes('--minify');

  if (!pluginName || pluginName.startsWith('--')) {
    console.error(
      'Usage: node scripts/build-plugin-frontend.js <plugin-name> [--minify]'
    );
    process.exit(1);
  }

  console.log(
    `\n📦 Building standalone frontend ESM bundle for: ${pluginName}...`
  );
  buildPluginFrontend(pluginName, { minify: isMinify })
    .then(({ outfile, sizeBytes }) => {
      const kb = (sizeBytes / 1024).toFixed(2);
      console.log(`✓ Bundle built successfully: ${outfile} (${kb} KB)\n`);
    })
    .catch((err) => {
      console.error(`✗ Frontend build failed:`, err.message);
      process.exit(1);
    });
}

export default buildPluginFrontend;
