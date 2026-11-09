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

const BASE_UI_EXPORTS = [
  'Avatar',
  'AvatarBadge',
  'AvatarFallback',
  'AvatarGroup',
  'AvatarGroupCount',
  'AvatarImage',
  'Badge',
  'badgeVariants',
  'Breadcrumb',
  'BreadcrumbEllipsis',
  'BreadcrumbItem',
  'BreadcrumbLink',
  'BreadcrumbList',
  'BreadcrumbPage',
  'BreadcrumbSeparator',
  'Button',
  'buttonVariants',
  'Card',
  'CardAction',
  'CardContent',
  'CardDescription',
  'CardFooter',
  'CardHeader',
  'CardSkeleton',
  'CardTitle',
  'Checkbox',
  'Dialog',
  'DialogClose',
  'DialogContent',
  'DialogDescription',
  'DialogFooter',
  'DialogHeader',
  'DialogOverlay',
  'DialogPortal',
  'DialogTitle',
  'DialogTrigger',
  'DropdownMenu',
  'DropdownMenuCheckboxItem',
  'DropdownMenuContent',
  'DropdownMenuGroup',
  'DropdownMenuItem',
  'DropdownMenuLabel',
  'DropdownMenuPortal',
  'DropdownMenuRadioGroup',
  'DropdownMenuRadioItem',
  'DropdownMenuSeparator',
  'DropdownMenuShortcut',
  'DropdownMenuSub',
  'DropdownMenuSubContent',
  'DropdownMenuSubTrigger',
  'DropdownMenuTrigger',
  'Form',
  'FormControl',
  'FormDescription',
  'FormField',
  'FormItem',
  'FormLabel',
  'FormMessage',
  'useFormField',
  'Input',
  'Label',
  'ScrollArea',
  'ScrollBar',
  'Select',
  'SelectContent',
  'SelectGroup',
  'SelectItem',
  'SelectLabel',
  'SelectScrollDownButton',
  'SelectScrollUpButton',
  'SelectSeparator',
  'SelectTrigger',
  'SelectValue',
  'Separator',
  'Sheet',
  'SheetClose',
  'SheetContent',
  'SheetDescription',
  'SheetFooter',
  'SheetHeader',
  'SheetTitle',
  'SheetTrigger',
  'Sidebar',
  'SidebarContent',
  'SidebarFooter',
  'SidebarGroup',
  'SidebarGroupAction',
  'SidebarGroupContent',
  'SidebarGroupLabel',
  'SidebarHeader',
  'SidebarInput',
  'SidebarInset',
  'SidebarMenu',
  'SidebarMenuAction',
  'SidebarMenuBadge',
  'SidebarMenuButton',
  'SidebarMenuItem',
  'SidebarMenuSkeleton',
  'SidebarMenuSub',
  'SidebarMenuSubButton',
  'SidebarMenuSubItem',
  'SidebarProvider',
  'SidebarRail',
  'SidebarSeparator',
  'SidebarTrigger',
  'useSidebar',
  'Skeleton',
  'Table',
  'TableBody',
  'TableCaption',
  'TableCell',
  'TableFooter',
  'TableHead',
  'TableHeader',
  'TableRow',
  'Textarea',
  'Toast',
  'ToastAction',
  'ToastClose',
  'ToastDescription',
  'ToastProvider',
  'ToastTitle',
  'ToastViewport',
  'Tooltip',
  'TooltipContent',
  'TooltipProvider',
  'TooltipTrigger',
  'cn',
  'useToast',
  'toast'
];

const BASE_ICON_EXPORTS = [
  'Activity',
  'AlertCircle',
  'AlertTriangle',
  'ArrowLeft',
  'ArrowRight',
  'Award',
  'Bell',
  'BookOpen',
  'Briefcase',
  'Building2',
  'Calendar',
  'Check',
  'CheckCircle',
  'CheckCircle2',
  'CheckSquare',
  'ChevronDown',
  'ChevronLeft',
  'ChevronRight',
  'ChevronUp',
  'Clock',
  'Copy',
  'Download',
  'Edit',
  'Edit2',
  'ExternalLink',
  'Eye',
  'EyeOff',
  'FileText',
  'Filter',
  'Flame',
  'Folder',
  'Globe',
  'GripVertical',
  'HelpCircle',
  'Home',
  'Info',
  'LayoutGrid',
  'List',
  'Loader2',
  'Lock',
  'LogOut',
  'Mail',
  'MapPin',
  'Menu',
  'MoreHorizontal',
  'MoreVertical',
  'Plus',
  'PlusCircle',
  'Puzzle',
  'RefreshCw',
  'Search',
  'Settings',
  'Share2',
  'Shield',
  'ShieldAlert',
  'ShieldCheck',
  'Sparkles',
  'Star',
  'Tag',
  'Target',
  'Trash',
  'Trash2',
  'TrendingUp',
  'Upload',
  'User',
  'UserCheck',
  'UserPlus',
  'Users',
  'X',
  'XCircle',
  'Zap'
];

/**
 * Scans a plugin directory for all imported named identifiers from a specific module.
 * Enables zero-touch dynamic shimming for any Lucide icon (1,500+) or Design System primitive (Issue #162).
 */
export function extractImportedSymbols(pluginDir, modulePattern) {
  const symbols = new Set();
  const validExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', 'dist', '.git', '.next'].includes(entry.name)) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && validExts.has(path.extname(entry.name))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const importRegex =
          /(?:import|export)\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const specifier = match[2];
          const isMatch =
            typeof modulePattern === 'string'
              ? specifier === modulePattern
              : modulePattern instanceof RegExp
                ? modulePattern.test(specifier)
                : false;

          if (isMatch) {
            match[1].split(',').forEach((item) => {
              const raw = item
                .trim()
                .split(/\s+as\s+/)[0]
                .trim();
              if (/^[a-zA-Z0-9_$]+$/.test(raw)) {
                symbols.add(raw);
              }
            });
          }
        }
      }
    }
  }

  scan(pluginDir);
  return Array.from(symbols);
}

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
 * Creates an esbuild plugin to shim host-provided shared modules (@campusos/design-system,
 * @campus-os/shared, and lucide-react) to window.CampusOS without bundling
 * duplicate dependencies or emitting unresolvable bare specifiers (Issue #131 / #160).
 */
export function createHostVirtualModulesPlugin(pluginDir) {
  // Dynamically discover all UI components and Lucide icons imported by this plugin
  const customUi = pluginDir
    ? extractImportedSymbols(pluginDir, /^@campusos\/design-system(\/.*)?$/)
    : [];
  const customIcons = pluginDir
    ? extractImportedSymbols(pluginDir, /^lucide-react$/)
    : [];

  const allUiExports = Array.from(
    new Set([...BASE_UI_EXPORTS, ...customUi])
  ).sort();
  const allIconExports = Array.from(
    new Set([...BASE_ICON_EXPORTS, ...customIcons])
  ).sort();

  return {
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

      build.onLoad({ filter: /.*/, namespace: 'campusos-ui-virtual' }, () => {
        const exportsList = allUiExports.join(',\n          ');
        return {
          contents: `
          const _host_runtime = (typeof window !== 'undefined' && (window.CampusOS || window.__CampusOS_Runtime__)) || {};
          const _host_ui = _host_runtime.ui || (typeof window !== 'undefined' && window.__CampusOS_DesignSystem__) || {};
          
          export const {
            ${exportsList}
          } = _host_ui;
          
          export default _host_ui;
        `,
          loader: 'js'
        };
      });

      // Intercept @campus-os/shared
      build.onResolve({ filter: /^@campus-os\/shared(\/.*)?$/ }, (args) => ({
        path: args.path,
        namespace: 'campusos-shared-virtual'
      }));

      build.onLoad(
        { filter: /.*/, namespace: 'campusos-shared-virtual' },
        () => ({
          contents: `
          const _host_runtime = (typeof window !== 'undefined' && (window.CampusOS || window.__CampusOS_Runtime__)) || {};
          export const registry = _host_runtime.registry || (typeof window !== 'undefined' && window.CampusOS?.registry);
          export const ExtensionPoint = _host_runtime.ExtensionPoint || (typeof window !== 'undefined' && window.CampusOS?.ExtensionPoint);
          export const apiClient = _host_runtime.apiClient || (typeof window !== 'undefined' && (window.CampusOS?.apiClient || window.__CampusOS_Runtime__?.apiClient));
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

      build.onLoad(
        { filter: /.*/, namespace: 'campusos-icons-virtual' },
        () => {
          const exportsList = allIconExports.join(',\n          ');
          return {
            contents: `
          const _host_runtime = (typeof window !== 'undefined' && (window.CampusOS || window.__CampusOS_Runtime__)) || {};
          const _host_icons = _host_runtime.icons || (typeof window !== 'undefined' && window.__CampusOS_Icons__) || {};

          export const {
            ${exportsList}
          } = _host_icons;

          export default _host_icons;
        `,
            loader: 'js'
          };
        }
      );
    }
  };
}

export const hostVirtualModulesPlugin = createHostVirtualModulesPlugin(null);

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
  const virtualModulesPlugin = createHostVirtualModulesPlugin(pluginDir);

  await esbuild.build({
    entryPoints: [entryPoint],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    jsx: 'automatic',
    plugins: [virtualModulesPlugin],
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
