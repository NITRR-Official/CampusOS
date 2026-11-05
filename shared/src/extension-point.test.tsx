import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registry } from './plugin-registry.js';
import { ExtensionPoint } from './extension-point.js';

describe('ExtensionPoint Micro-UI & Registry System (Issues #125, #132, #133)', () => {
  beforeEach(() => {
    registry.clear();
  });

  describe('PluginRegistry', () => {
    it('registers widgets and returns them sorted by priority descending', () => {
      const LowPriorityWidget = () => <div>Low Priority</div>;
      const HighPriorityWidget = () => <div>High Priority</div>;
      const DefaultPriorityWidget = () => <div>Default Priority</div>;

      registry.registerWidget(
        'dashboard-stats',
        'plugin-a',
        LowPriorityWidget,
        {
          priority: 10
        }
      );
      registry.registerWidget(
        'dashboard-stats',
        'plugin-b',
        HighPriorityWidget,
        {
          priority: 100
        }
      );
      registry.registerWidget(
        'dashboard-stats',
        'plugin-c',
        DefaultPriorityWidget
      ); // default priority 0

      const widgets = registry.getWidgets('dashboard-stats');
      expect(widgets).toHaveLength(3);
      expect(widgets[0].pluginId).toBe('plugin-b'); // 100
      expect(widgets[1].pluginId).toBe('plugin-a'); // 10
      expect(widgets[2].pluginId).toBe('plugin-c'); // 0
    });

    it('unregisters a specific widget from a slot', () => {
      const Dummy = () => <div>Dummy</div>;
      registry.registerWidget('dashboard-stats', 'plugin-a', Dummy);
      registry.registerWidget('dashboard-stats', 'plugin-b', Dummy);

      const removed = registry.unregisterWidget('dashboard-stats', 'plugin-a');
      expect(removed).toBe(true);

      const widgets = registry.getWidgets('dashboard-stats');
      expect(widgets).toHaveLength(1);
      expect(widgets[0].pluginId).toBe('plugin-b');
    });

    it('unregisters all widgets and links for a plugin during teardown', () => {
      const Dummy = () => <div>Dummy</div>;
      registry.registerWidget('dashboard-stats', 'bad-plugin', Dummy);
      registry.registerWidget('dashboard-actions', 'bad-plugin', Dummy);
      registry.registerWidget('dashboard-stats', 'good-plugin', Dummy);
      registry.registerSidebarLink({
        pluginId: 'bad-plugin',
        title: 'Bad Nav',
        url: '/bad'
      });
      registry.registerSidebarLink({
        pluginId: 'good-plugin',
        title: 'Good Nav',
        url: '/good'
      });

      const count = registry.unregisterWidgetsByPlugin('bad-plugin');
      expect(count).toBe(2);

      expect(registry.getWidgets('dashboard-stats')).toHaveLength(1);
      expect(registry.getWidgets('dashboard-actions')).toHaveLength(0);
      expect(registry.getSidebarLinks()).toHaveLength(1);
      expect(registry.getSidebarLinks()[0].pluginId).toBe('good-plugin');
    });
  });

  describe('ExtensionPoint Component', () => {
    it('renders widgets in priority order with container query and isolation attributes', () => {
      const WidgetA = () => <span>Widget A</span>;
      const WidgetB = () => <span>Widget B</span>;

      registry.registerWidget('dashboard-actions', 'plugin-a', WidgetA, {
        priority: 10
      });
      registry.registerWidget('dashboard-actions', 'plugin-b', WidgetB, {
        priority: 50
      });

      const html = renderToStaticMarkup(
        <ExtensionPoint id="dashboard-actions" className="custom-grid" />
      );

      // Wrapper checks (Issue #132)
      expect(html).toContain('data-extension-id="dashboard-actions"');
      expect(html).toContain('@container');
      expect(html).toContain('isolate');
      expect(html).toContain('overflow-hidden');
      expect(html).toContain('custom-grid');
      expect(html).toContain('container-type:inline-size');

      // Individual widget wrappers
      expect(html).toContain('data-plugin-widget="plugin-b"');
      expect(html).toContain('data-plugin-widget="plugin-a"');

      // Priority ordering check: Widget B (50) should appear before Widget A (10)
      const indexB = html.indexOf('Widget B');
      const indexA = html.indexOf('Widget A');
      expect(indexB).toBeGreaterThan(-1);
      expect(indexA).toBeGreaterThan(-1);
      expect(indexB).toBeLessThan(indexA);
    });

    it('filters out widgets belonging to inactive plugins', () => {
      const ActiveWidget = () => <div>Active Plugin Output</div>;
      const InactiveWidget = () => <div>Inactive Plugin Output</div>;

      registry.registerWidget('dashboard-stats', 'active-plugin', ActiveWidget);
      registry.registerWidget(
        'dashboard-stats',
        'inactive-plugin',
        InactiveWidget
      );

      const html = renderToStaticMarkup(
        <ExtensionPoint
          id="dashboard-stats"
          activePlugins={['active-plugin']}
        />
      );

      expect(html).toContain('Active Plugin Output');
      expect(html).not.toContain('Inactive Plugin Output');
    });

    it('evaluates condition predicates against context', () => {
      interface Context {
        userRole: 'admin' | 'student';
      }

      const AdminWidget = ({ context }: { context?: Context }) => (
        <div>Admin Widget: {context?.userRole}</div>
      );
      const StudentWidget = ({ context }: { context?: Context }) => (
        <div>Student Widget: {context?.userRole}</div>
      );

      registry.registerWidget<Context>(
        'profile-header-actions',
        'admin-mod',
        AdminWidget,
        {
          condition: (ctx) => ctx?.userRole === 'admin'
        }
      );
      registry.registerWidget<Context>(
        'profile-header-actions',
        'student-mod',
        StudentWidget,
        {
          condition: (ctx) => ctx?.userRole === 'student'
        }
      );

      const studentHtml = renderToStaticMarkup(
        <ExtensionPoint
          id="profile-header-actions"
          context={{ userRole: 'student' }}
        />
      );

      expect(studentHtml).toContain('Student Widget: student');
      expect(studentHtml).not.toContain('Admin Widget');

      const adminHtml = renderToStaticMarkup(
        <ExtensionPoint
          id="profile-header-actions"
          context={{ userRole: 'admin' }}
        />
      );

      expect(adminHtml).toContain('Admin Widget: admin');
      expect(adminHtml).not.toContain('Student Widget');
    });

    it('renders fallback when no widgets match or all conditions fail', () => {
      const html = renderToStaticMarkup(
        <ExtensionPoint
          id="dashboard-stats"
          fallback={<p className="empty">No stats available</p>}
        />
      );

      expect(html).toContain('No stats available');
    });

    it('isolates crashing widgets without crashing sibling widgets (Error Boundary)', () => {
      const HealthyWidget = () => <div>Healthy Widget Running</div>;
      const BrokenWidget = () => {
        throw new Error('Simulated widget crash during render');
      };

      // Suppress console.error during this test
      const spyConsole = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      registry.registerWidget('dashboard-stats', 'good-plugin', HealthyWidget, {
        priority: 10
      });
      registry.registerWidget('dashboard-stats', 'bad-plugin', BrokenWidget, {
        priority: 20
      });

      const html = renderToStaticMarkup(
        <ExtensionPoint
          id="dashboard-stats"
          fallbackWidget={({ pluginId }) => (
            <div className="error-fallback">Plugin {pluginId} failed</div>
          )}
        />
      );

      // The healthy widget should STILL render successfully!
      expect(html).toContain('Healthy Widget Running');
      // The broken widget should render the fallback
      expect(html).toContain('Plugin bad-plugin failed');

      spyConsole.mockRestore();
    });
  });
});
