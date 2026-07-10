import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchClubs } from '@plugins/club/frontend/api';
import { Building2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function AdminOverviewPage() {
  const pendingClubs = await fetchClubs('pending').catch(() => []);
  const activeClubs = await fetchClubs('approved').catch(() => []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur-xl border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
            <AlertCircle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingClubs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Clubs awaiting review</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clubs</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeClubs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved clubs on campus</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clubs</CardTitle>
            <Building2 className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingClubs.length + activeClubs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total registered clubs</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Link href="/admin/clubs" className="group block">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 transition-all hover:bg-primary/10 hover:border-primary/30 hover:shadow-md">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start md:items-center gap-5">
                <div className="flex shrink-0 items-center justify-center size-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary border border-primary/20 shadow-inner">
                  <Building2 className="size-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    Review Pending Clubs
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    You have <strong className="text-foreground">{pendingClubs.length}</strong> new club {pendingClubs.length === 1 ? 'proposal' : 'proposals'} awaiting your review. 
                    Approve or reject them to manage the campus community.
                  </p>
                </div>
              </div>
              
              <div className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm group-hover:shadow-primary/25 group-hover:bg-primary/90 transition-all active:scale-95">
                Manage Clubs
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
