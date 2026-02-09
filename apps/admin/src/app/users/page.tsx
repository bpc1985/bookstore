"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@bookstore/ui";
import { Input } from "@bookstore/ui";
import { Card } from "@bookstore/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bookstore/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bookstore/ui";
import { Badge } from "@bookstore/ui";
import { Skeleton } from "@bookstore/ui";
import { Search, Shield, Check, Ban, Users as UsersIcon, Eye } from "lucide-react";
import { api } from "@/lib/api";
import type { User, PaginatedResponse } from "@bookstore/types";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@bookstore/ui";
import { useAuthStore } from "@/stores/auth";

export default function UsersListPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      try {
        const data: PaginatedResponse<User> = await api.getUsers({
          role: roleFilter || undefined,
          is_active: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
          page,
          size: 20,
        });
        setUsers(data.items);
        setTotalPages(Math.ceil(data.total / 20));
      } catch {
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, [search, roleFilter, statusFilter, page]);

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    api.updateUserRole(selectedUser.id, newRole)
      .then(() => {
        toast.success(`User role updated to ${newRole}`);
        setRoleDialogOpen(false);
        setSelectedUser(null);
        setUsers(users.map(u =>
          u.id === selectedUser.id ? { ...u, role: newRole as User["role"] } : u
        ));
      })
      .catch(() => {
        toast.error("Failed to update user role");
      });
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    const isActive = selectedUser.is_active;
    const action = isActive ?
      api.deactivateUser(selectedUser.id) :
      api.activateUser(selectedUser.id);

    action
      .then(() => {
        toast.success(isActive ? "User deactivated" : "User activated");
        setStatusDialogOpen(false);
        setSelectedUser(null);
        setUsers(users.map(u =>
          u.id === selectedUser.id ? { ...u, is_active: !isActive } : u
        ));
      })
      .catch(() => {
        toast.error("Failed to update user status");
      });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Card className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
          </div>
        </Card>
        <Card>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b px-6 py-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage user accounts and roles
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter || "all"} onValueChange={(value) => setRoleFilter(value === "all" ? "" : value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UsersIcon className="h-8 w-8" />
                    <p>No users found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-muted-foreground">{user.id}</TableCell>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="gap-1 font-normal"
                    >
                      <Shield className="h-3 w-3" />
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`font-normal ${
                        user.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/users/${user.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {user.role !== "admin" && user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole("admin");
                            setRoleDialogOpen(true);
                          }}
                        >
                          Make Admin
                        </Button>
                      )}
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${
                            user.is_active
                              ? "text-destructive hover:text-destructive"
                              : "text-emerald-600 hover:text-emerald-600"
                          }`}
                          onClick={() => {
                            setSelectedUser(user);
                            setStatusDialogOpen(true);
                          }}
                        >
                          {user.is_active ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-1">
                  {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                  <Button
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                </span>
              );
            })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Update Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Change role for {selectedUser.full_name} ({selectedUser.email})?
                  Current role: <Badge className="ml-1">{selectedUser.role}</Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={!newRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_active ? "Deactivate User" : "Activate User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  {selectedUser.is_active ? (
                    <>
                      Deactivate {selectedUser.full_name}? They will not be able to log in.
                    </>
                  ) : (
                    <>
                      Activate {selectedUser.full_name}? They will be able to log in again.
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.is_active ? "destructive" : "default"}
              onClick={handleToggleStatus}
            >
              {selectedUser?.is_active ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
