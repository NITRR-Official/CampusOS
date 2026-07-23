import Link from 'next/link';
import {
  Calendar,
  Gauge,
  Layers,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import { Button } from '@campusos/design-system';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@campusos/design-system';
import { ThemeToggle } from '@/components/ThemeToggle';

const HIGHLIGHTS = [
  {
    title: 'Unified operations',
    description:
      'Connect institutes, clubs, events, and resources in one view.',
    icon: Layers
  },
  {
    title: 'Real-time visibility',
    description: 'Track attendance, approvals, and schedules as they happen.',
    icon: Gauge
  },
  {
    title: 'Member-first experiences',
    description: 'Give students and staff a single destination for updates.',
    icon: Users
  },
  {
    title: 'Secure by default',
    description: 'Role-based controls and audit-ready activity trails.',
    icon: ShieldCheck
  }
];

const MODULES = [
  {
    title: 'Events and calendars',
    description: 'Plan, approve, and broadcast events across the campus.',
    icon: Calendar
  },
  {
    title: 'Clubs and communities',
    description: 'Organize memberships, requests, and shared spaces.',
    icon: Sparkles
  },
  {
    title: 'Tasks and workflows',
    description: 'Keep operational work visible with accountable owners.',
    icon: Gauge
  },
  {
    title: 'Resources and vendors',
    description: 'Track assets, bookings, and vendor coordination.',
    icon: Layers
  }
];

const STEPS = [
  {
    step: '01',
    title: 'Map your campus',
    description: 'Set up institutes, clubs, and teams in a shared directory.'
  },
  {
    step: '02',
    title: 'Publish workflows',
    description: 'Launch event approvals, task routing, and comms rituals.'
  },
  {
    step: '03',
    title: 'Measure outcomes',
    description: 'Watch participation, spend, and utilization in one place.'
  }
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.2),transparent_60%)] blur-3xl" />
        <div className="absolute right-[-8%] top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.16),transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 dark:opacity-20" />
      </div>

      <header className="relative z-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
              CO
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                CampusOS
              </p>
              <p className="text-sm font-medium text-foreground">
                Operating system for campuses
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
            <Link
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Platform
            </Link>
            <Link
              href="#modules"
              className="transition-colors hover:text-foreground"
            >
              Modules
            </Link>
            <Link
              href="#workflow"
              className="transition-colors hover:text-foreground"
            >
              Workflow
            </Link>
            <Link
              href="#launch"
              className="transition-colors hover:text-foreground"
            >
              Launch
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              className="hidden h-10 lg:inline-flex"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="h-10 px-5">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-6 pb-16 pt-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-primary" />
              CampusOS Platform
            </div>
            <div>
              <h1 className="display-lg">
                Campus operations, finally in sync.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Align institutes, clubs, events, and vendors with a single
                source of truth. CampusOS keeps schedules, approvals, and
                communication moving together.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-11 px-6">
                <Link href="/dashboard">View dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-6">
                <Link href="/signup">Create account</Link>
              </Button>
              <Button asChild variant="ghost" className="h-11 px-6">
                <Link href="/login">Login</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Active modules', value: '12+' },
                { label: 'Teams onboarded', value: '40+' },
                { label: 'Automations', value: '120+' },
                { label: 'Uptime', value: '99.9%' }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-card/70 p-4 text-left shadow-sm backdrop-blur"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 bg-card/80 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle>Campus pulse</CardTitle>
                <CardDescription>
                  A live snapshot of operational activity across the campus.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: 'Event approvals',
                    detail: '6 pending reviews from clubs and departments.'
                  },
                  {
                    title: 'Resource bookings',
                    detail: '18 spaces reserved for this week.'
                  },
                  {
                    title: 'New member requests',
                    detail: '24 join requests awaiting verification.'
                  }
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-border bg-muted/40 p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader>
                  <CardTitle>Command map</CardTitle>
                  <CardDescription>
                    Institutes, clubs, and vendors in one workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {['Institutes', 'Clubs', 'Events', 'Resources'].map(
                    (item) => (
                      <div
                        key={item}
                        className="rounded-lg border border-border/70 bg-background/80 px-3 py-2"
                      >
                        {item}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-primary text-primary-foreground shadow-sm">
                <CardHeader>
                  <CardTitle className="text-primary-foreground">
                    Ready to scale
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    Expand from one institute to the entire campus.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-primary-foreground/80">
                    Unified approvals and audit trails.
                  </p>
                  <p className="text-primary-foreground/80">
                    Shared templates for events and tasks.
                  </p>
                  <p className="text-primary-foreground/80">
                    Live reporting across departments.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                Platform pillars
              </p>
              <h2 className="mt-3">Built for every campus team.</h2>
            </div>
            <p className="max-w-xl text-base text-muted-foreground">
              Replace fragmented tools with one operational layer that keeps
              student affairs, facilities, and leadership aligned.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="border-border/60 bg-card/80 shadow-sm backdrop-blur"
                >
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="modules" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-[0.6fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                Modules
              </p>
              <h2 className="mt-3">Everything your campus runs on.</h2>
              <p className="mt-4 text-base text-muted-foreground">
                Mix and match modules to match your campus size. Each module
                shares the same data fabric so you never duplicate work.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {MODULES.map((module) => {
                const Icon = module.icon;
                return (
                  <Card
                    key={module.title}
                    className="border-border/60 bg-card/80 shadow-sm backdrop-blur"
                  >
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="mt-3">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="rounded-3xl border border-border bg-card/70 p-10 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                  Workflow
                </p>
                <h2 className="mt-3">From onboarding to outcomes.</h2>
              </div>
              <Button asChild variant="outline" className="h-11">
                <Link href="/dashboard">Explore the workspace</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step) => (
                <div
                  key={step.step}
                  className="space-y-3 rounded-2xl border border-border bg-background/80 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                    {step.step}
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="launch" className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="rounded-3xl bg-primary px-10 py-12 text-primary-foreground shadow-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-primary-foreground">
                  Launch your campus OS.
                </h2>
                <p className="mt-3 text-base text-primary-foreground/80">
                  Start with the modules you need today and scale campus-wide
                  without replatforming.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-11 bg-background text-foreground hover:bg-background/90"
                >
                  <Link href="/signup">Start free</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link href="/login">Schedule a walk-through</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border bg-background/80 py-8 text-sm text-muted-foreground backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center">
          <p>CampusOS - Campus management and community operations.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">
              Login
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Sign up
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
