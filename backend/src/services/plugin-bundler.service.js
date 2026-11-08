/**
 * Standalone Plugin Frontend ESM Bundler Service (ADR-014 / Issue #118 / Issue #163)
 * Compiles a plugin's frontend into a self-contained, browser-executable ES module
 * with externalized React and CampusOS host runtime bindings.
 */

import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';

export const DEFAULT_PLUGINS_DIR =
  process.env.PLUGINS_DIR || path.resolve(process.cwd(), 'plugins');

/**
 * Discovers the frontend entrypoint for a plugin.
 * @param {string} pluginDir - Directory of the plugin
 * @returns {string|null} - Path to frontend entrypoint file or null
 */
export function findFrontendEntrypoint(pluginDir) {
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
 * esbuild plugin to shim host-provided shared modules (@campusos/design-system,
 * @campus-os/shared, and lucide-react) to window.CampusOS without bundling
 * duplicate dependencies or emitting unresolvable bare specifiers (Issue #131 / #160).
 */
export const hostVirtualModulesPlugin = {
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
        export const apiClient = runtime.apiClient || (typeof window !== 'undefined' && (window.CampusOS?.apiClient || window.__CampusOS_Runtime__?.apiClient));
        export default { registry, ExtensionPoint, apiClient };
      `,
        loader: 'js'
      })
    );

    // Intercept lucide-react (Issue #160)
    build.onResolve({ filter: /^lucide-react$/ }, (args) => ({
      path: args.path,
      namespace: 'campusos-icons-virtual'
    }));

    build.onLoad({ filter: /.*/, namespace: 'campusos-icons-virtual' }, () => ({
      contents: `
        const runtime = (typeof window !== 'undefined' && (window.CampusOS || window.__CampusOS_Runtime__)) || {};
        const icons = runtime.icons || (typeof window !== 'undefined' && window.__CampusOS_Icons__) || {};

        export const {
          Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Award,
          BookOpen, Briefcase, Calendar, Check, CheckCircle, CheckCircle2,
          CheckSquare, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
          Clock, Copy, Download, Edit, Edit2, ExternalLink, Eye, EyeOff,
          FileText, Filter, Folder, Globe, GripVertical, HelpCircle, Home,
          Info, LayoutGrid, List, Loader2, Lock, LogOut, Mail, MapPin,
          Menu, MoreHorizontal, MoreVertical, Plus, PlusCircle, RefreshCw,
          Search, Settings, Share2, Shield, ShieldAlert, Sparkles, Star,
          Tag, Target, Trash, Trash2, Upload, User, UserCheck, UserPlus,
          Users, X, XCircle
        } = icons;

        export default icons;
      `,
      loader: 'js'
    }));
  }
};

/**
 * Builds a standalone frontend ESM bundle for a specified plugin.
 *
 * @param {string} pluginName - Name of plugin in plugins directory
 * @param {object} [options]
 * @param {boolean} [options.minify=false]
 * @param {boolean} [options.sourcemap=true]
 * @param {string} [options.pluginsDir]
 * @returns {Promise<{ outfile: string, sizeBytes: number }>}
 */
export async function buildPluginFrontend(pluginName, options = {}) {
  const pluginsDir = options.pluginsDir || DEFAULT_PLUGINS_DIR;
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

export default buildPluginFrontend;
