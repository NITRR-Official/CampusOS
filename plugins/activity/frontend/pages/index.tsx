import React from 'react';
import { Card, Button } from '@campusos/design-system';

export default function ActivityPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          ActivityPage
        </h1>
        <p className="mt-4 text-slate-300">
          Welcome to the newly scaffolded activity plugin!
        </p>
        <Button className="mt-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">
          Get Started
        </Button>
      </Card>
    </div>
  );
}
