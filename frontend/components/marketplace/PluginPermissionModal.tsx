'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge
} from '@campusos/design-system';
import {
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { PluginCapabilityBadge } from '@/components/admin/PluginCapabilityBadge';

export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  verified: boolean;
  category: string;
  icon?: string;
  description: string;
  tags?: string[];
  rating?: number;
  downloads?: number;
  capabilities?: string[];
  downloadUrl?: string;
  minCampusOsVersion?: string;
}

interface PluginPermissionModalProps {
  plugin: MarketplacePlugin | null;
  isOpen: boolean;
  isInstalling: boolean;
  onClose: () => void;
  onConfirm: (plugin: MarketplacePlugin) => void;
}

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'db:rw': 'Database Read & Write: Direct read/write access to persist data.',
  'db:r': 'Database Read: Read-only access to query database records.',
  'events:listen':
    'Event Bus Listen: Can subscribe to system and domain events.',
  'events:emit': 'Event Bus Emit: Can broadcast custom domain events.',
  'network:outbound':
    'Outbound Network: May communicate with external third-party APIs.',
  'storage:upload': 'File Storage: Can upload, store, and serve media files.',
  'ui:slot': 'UI Slots: Can render widgets in dashboards and navigation bars.',
  '*': 'Full System Access: Unrestricted administrative capability.'
};

export function PluginPermissionModal({
  plugin,
  isOpen,
  isInstalling,
  onClose,
  onConfirm
}: PluginPermissionModalProps) {
  if (!plugin) return null;

  const capabilities = plugin.capabilities || [];
  const hasHighRiskPerms = capabilities.some(
    (c) => c === '*' || c === 'network:outbound' || c === 'db:rw'
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isInstalling && onClose()}
    >
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/80">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="text-xs text-primary border-primary/30 bg-primary/10"
            >
              {plugin.category}
            </Badge>
            {plugin.verified && (
              <Badge
                variant="outline"
                className="text-[11px] text-cyan-600 dark:text-cyan-400 border-cyan-500/20 bg-cyan-500/10 flex items-center gap-1"
              >
                <ShieldCheck className="size-3" />
                Verified Publisher
              </Badge>
            )}
          </div>

          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Install {plugin.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Version {plugin.version} by {plugin.author}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs text-foreground/90 leading-relaxed">
            {plugin.description}
          </p>

          {/* Security Banner */}
          <div
            className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
              hasHighRiskPerms
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                : 'border-border/60 bg-muted/40 text-muted-foreground'
            }`}
          >
            {hasHighRiskPerms ? (
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-500" />
            ) : (
              <ShieldAlert className="size-4 shrink-0 mt-0.5 text-primary" />
            )}
            <div>
              <p className="font-semibold text-[11px] uppercase tracking-wider">
                Permission Audit
              </p>
              <p className="mt-0.5 text-[11px]">
                Review the requested capabilities below before installing.
                Plugins run in a secure capability-restricted sandbox.
              </p>
            </div>
          </div>

          {/* Requested Capabilities */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Requested Capabilities ({capabilities.length})
            </p>
            {capabilities.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {capabilities.map((cap) => (
                  <div
                    key={cap}
                    className="p-2.5 rounded-lg border border-border/50 bg-background/50 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <PluginCapabilityBadge capability={cap} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {PERMISSION_DESCRIPTIONS[cap] ||
                        `Grants '${cap}' capability permission.`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No special capabilities requested (fully sandboxed).
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isInstalling}
            className="w-full sm:w-auto text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onConfirm(plugin)}
            disabled={isInstalling}
            className="w-full sm:w-auto text-xs font-semibold"
          >
            {isInstalling ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Installing Package...
              </>
            ) : (
              <>
                <Check className="size-3.5 mr-1.5" />
                Accept & Install
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PluginPermissionModal;
