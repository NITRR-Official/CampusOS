/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@campus-os/shared/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@campusos/design-system';
import { Badge } from '@campusos/design-system';
import { Skeleton } from '@campusos/design-system';

interface User {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await apiClient.get<any>('/users');
        // apiClient automatically unwraps { success: true, data } and returns the data array
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setError('Failed to fetch users');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  async function handleToggleRole(userId: string, currentRole: boolean) {
    setActionLoading(userId);
    try {
      await apiClient.patch(`/users/${userId}/role`, {
        isSuperAdmin: !currentRole
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isSuperAdmin: !currentRole } : u
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleStatus(userId: string, currentStatus: boolean) {
    setActionLoading(userId);
    try {
      await apiClient.patch(`/users/${userId}/status`, {
        isActive: !currentStatus
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isActive: !currentStatus } : u
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Registered Users
        </h2>
        <p className="text-sm text-muted-foreground">
          View all members registered on CampusOS.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="border border-border/50 rounded-md overflow-hidden bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-[150px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.isSuperAdmin ? (
                      <Badge
                        variant="default"
                        className="bg-primary/20 text-primary hover:bg-primary/30 border-none"
                      >
                        Super Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal">
                        User
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isActive !== false ? (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-red-600 border-red-200 bg-red-50"
                      >
                        Blocked
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRole(user.id, user.isSuperAdmin);
                        }}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
                      >
                        {user.isSuperAdmin
                          ? 'Revoke Super Admin'
                          : 'Make Super Admin'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(user.id, user.isActive !== false);
                        }}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1 text-xs font-medium rounded-md border border-input bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 transition-colors"
                      >
                        {user.isActive !== false ? 'Block' : 'Unblock'}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-card border border-border shadow-lg rounded-xl w-full max-w-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4">User Details</h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Name</div>
                <div className="col-span-2 font-medium">
                  {selectedUser.name}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Email</div>
                <div className="col-span-2">{selectedUser.email}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Role</div>
                <div className="col-span-2">
                  {selectedUser.isSuperAdmin ? 'Super Admin' : 'Regular User'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Status</div>
                <div className="col-span-2">
                  {selectedUser.isActive !== false ? 'Active' : 'Blocked'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Joined</div>
                <div className="col-span-2">
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleString()
                    : 'Unknown'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Internal ID</div>
                <div className="col-span-2 text-xs font-mono">
                  {selectedUser.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
