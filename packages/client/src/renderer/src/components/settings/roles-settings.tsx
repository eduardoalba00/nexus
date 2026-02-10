import { useState, useEffect } from "react";
import { Plus, Trash2, Shield } from "lucide-react";
import { ROLE_ROUTES, buildRoute, Permission } from "@nexus/shared";
import type { Role } from "@nexus/shared";
import { api } from "@/lib/api";

interface RolesSettingsProps {
  serverId: string;
}

const PERMISSION_LABELS: { perm: number; label: string }[] = [
  { perm: Permission.SEND_MESSAGES, label: "Send Messages" },
  { perm: Permission.MANAGE_MESSAGES, label: "Manage Messages" },
  { perm: Permission.MANAGE_CHANNELS, label: "Manage Channels" },
  { perm: Permission.MANAGE_ROLES, label: "Manage Roles" },
  { perm: Permission.KICK_MEMBERS, label: "Kick Members" },
  { perm: Permission.BAN_MEMBERS, label: "Ban Members" },
  { perm: Permission.MANAGE_SERVER, label: "Manage Server" },
  { perm: Permission.ADMINISTRATOR, label: "Administrator" },
];

export function RolesSettings({ serverId }: RolesSettingsProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editPerms, setEditPerms] = useState(0);
  const [newRoleName, setNewRoleName] = useState("");

  useEffect(() => {
    fetchRoles();
  }, [serverId]);

  const fetchRoles = async () => {
    const data = await api.get<Role[]>(buildRoute(ROLE_ROUTES.LIST, { serverId }));
    setRoles(data.sort((a, b) => b.position - a.position));
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    await api.post(buildRoute(ROLE_ROUTES.CREATE, { serverId }), { name: newRoleName.trim() });
    setNewRoleName("");
    await fetchRoles();
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setEditName(role.name);
    setEditColor(role.color || "");
    setEditPerms(role.permissions);
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;
    await api.patch(buildRoute(ROLE_ROUTES.UPDATE, { serverId, roleId: selectedRole.id }), {
      name: editName,
      color: editColor || null,
      permissions: editPerms,
    });
    await fetchRoles();
    setSelectedRole(null);
  };

  const handleDeleteRole = async (roleId: string) => {
    await api.delete(buildRoute(ROLE_ROUTES.DELETE, { serverId, roleId }));
    if (selectedRole?.id === roleId) setSelectedRole(null);
    await fetchRoles();
  };

  const togglePerm = (perm: number) => {
    setEditPerms((prev) => prev ^ perm);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateRole()}
          placeholder="New role name..."
          className="flex-1 px-3 py-2 bg-muted rounded text-sm outline-none"
        />
        <button
          onClick={handleCreateRole}
          disabled={!newRoleName.trim()}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      <div className="flex gap-4">
        {/* Role list */}
        <div className="w-48 space-y-1">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-left transition-colors ${
                selectedRole?.id === role.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: role.color || "#888" }}
              />
              <span className="truncate flex-1">{role.name}</span>
              {role.isDefault && <Shield className="h-3 w-3 opacity-50" />}
            </button>
          ))}
        </div>

        {/* Role editor */}
        {selectedRole && (
          <div className="flex-1 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-muted rounded text-sm outline-none mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={editColor || "#888888"}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  placeholder="#hex"
                  className="px-3 py-2 bg-muted rounded text-sm outline-none w-28"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Permissions</label>
              <div className="mt-1 space-y-1">
                {PERMISSION_LABELS.map(({ perm, label }) => (
                  <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(editPerms & perm) !== 0}
                      onChange={() => togglePerm(perm)}
                      className="rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
              >
                Save Changes
              </button>
              {!selectedRole.isDefault && (
                <button
                  onClick={() => handleDeleteRole(selectedRole.id)}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded text-sm"
                >
                  <Trash2 className="h-3 w-3 inline mr-1" />
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
