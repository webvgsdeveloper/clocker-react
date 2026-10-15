// src/components/admin/Dashboard.jsx
import { lazy, Suspense, memo, useCallback } from "react";
import {
  faUserPlus,
  faTimeline,
  faUser,
  faClockRotateLeft,
  faUserClock,
  faComments,
  faBell,
  faChartLine,
  faCircleNotch,
  faBusinessTime,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { useDashboard } from "../../hooks/useDashboard";
import Header from "../layout/Header";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Pagination from "../common/Pagination";

const StatusManager = lazy(() => import("../dashboard/StatusManager"));
const MyAttendance = lazy(() => import("../dashboard/MyAttendance"));
const UserTable = lazy(() => import("./UserTable"));
const UserForm = lazy(() => import("./UserForm"));
const StatusGrid = lazy(() => import("./StatusGrid"));
const HistoryPanel = lazy(() => import("./HistoryPanel"));
const ChatPanel = lazy(() => import("./ChatPanel"));
const NotificationsPanel = lazy(() => import("./NotificationsPanel"));
const ReportsPanel = lazy(() => import("./ReportsPanel"));
const EventsPanel = lazy(() => import("../events/EventsPanel"));
const FilterBar = lazy(() => import("./FilterBar"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-12 text-vgsgray animate-pulse">
    <Badge
        variant="blue"
        size="lg"
        icon={faCircleNotch}
        className="relative z-10 [&>svg]:animate-spin px-5 py-2 border border-vgsdarkblue/10"
      >
        Loading
      </Badge>
  </div>
);

const DashboardNavigation = memo(({ allowedTabs, activeTab, onTabChange }) => {
  if (allowedTabs.length <= 1) return null;
  return (
    <nav className="border-b border-vgsgray/50 bg-vgswhite sticky top-20 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <ul className="-mb-px flex space-x-2 p-1 pb-1 overflow-x-auto no-scrollbar">
          {allowedTabs.map((tab) => (
            <li key={tab.id}>
              <Button
                onClick={() => onTabChange(tab.id)}
                variant={activeTab === tab.id ? "active" : "transparent"}
                animation={activeTab === tab.id ? null : "pop"}
                icon={tab.icon}
                className="whitespace-nowrap text-xs sm:text-sm transition-all duration-200"
              >
                {tab.label}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
});

const ALL_TABS = [
  {
    id: "my_status",
    label: "My Status",
    icon: faUserClock,
    perm: "Update Status",
  },
  {
    id: "my_attendance",
    label: "My Attendance",
    icon: faBusinessTime,
    perm: "Update Status",
  },
  { id: "status", label: "Real-Time", icon: faTimeline, perm: "Manage Users" },
  { id: "users", label: "Users List", icon: faUser, perm: "Edit Users" },
  {
    id: "history",
    label: "History",
    icon: faClockRotateLeft,
    perm: "View history",
  },
  { id: "chat", label: "Chat", icon: faComments, perm: "Chat" },
  {
    id: "notifications",
    label: "Notifications",
    icon: faBell,
    perm: "Send Custom Notifications",
  },
  {
    id: "events",
    label: "Events",
    icon: faCalendarDays,
    perm: ["Update Status", "create_events"],
  },
  {
    id: "reports",
    label: "Stats & Payroll",
    icon: faChartLine,
    perm: "View stats",
  },
];

const AdminDashboard = () => {
  const {
    user,
    token,
    users,
    loading,
    showUserForm,
    setShowUserForm,
    editingUser,
    setEditingUser,
    activeTab,
    setActiveTab,
    lastUpdate,
    currentPage,
    setCurrentPage,
    meta,
    filters,
    setFilters,
    debouncedFilters,
    allowedTabs,
    handleCreateUser,
    handleDeleteUser,
    handleEditUser,
    sorting,
    handleSort,
  } = useDashboard(ALL_TABS);

  const needsFilterBar = ["status", "users", "chat"].includes(activeTab);
  const needsPagination = ["status", "users"].includes(activeTab);
  const showStatusFilter = ["status", "chat"].includes(activeTab);

  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      setCurrentPage(1);
    },
    [setActiveTab, setCurrentPage],
  );

  const handleFilterChange = useCallback(
    (k, v) => {
      setFilters((prev) => ({ ...prev, [k]: v }));
    },
    [setFilters],
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      nombre: "",
      cedula: "",
      estado: "",
      fechaInicio: null,
      fechaFin: null,
    });
  }, [setFilters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Office Live Hub" />
      <DashboardNavigation
        allowedTabs={allowedTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<TabLoader />}>
          <div
            key={activeTab}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
          >
            {needsFilterBar && (
              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClear={handleClearFilters}
                showStatusFilter={showStatusFilter}
              />
            )}
            <section className="mt-2">
              {activeTab === "my_status" && <StatusManager />}

              {activeTab === "status" &&
                (loading && users.length === 0 ? (
                  <div className="text-center py-12 text-vgsgray">
                    Synchronizing...
                  </div>
                ) : (
                  <StatusGrid
                    users={users}
                    lastUpdate={lastUpdate}
                    currentPage={currentPage}
                    sorting={sorting}
                    onSort={handleSort}
                  />
                ))}
              {activeTab === "my_attendance" && <MyAttendance token={token} />}
              {activeTab === "users" && (
                <div>
                  <header className="mb-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-vgsred">
                      User Administration
                    </h2>
                    <Button
                      onClick={() => {
                        setEditingUser(null);
                        setShowUserForm(true);
                      }}
                      variant="blue"
                      animation="shrink"
                      icon={faUserPlus}
                    >
                      New User
                    </Button>
                  </header>
                  {loading && users.length === 0 ? (
                    <div className="text-center py-12 text-vgsgray">
                      Loading directory...
                    </div>
                  ) : (
                    <UserTable
                      users={users}
                      onDelete={handleDeleteUser}
                      onEdit={handleEditUser}
                      sorting={sorting}
                      onSort={handleSort}
                    />
                  )}
                </div>
              )}
              {activeTab === "history" && <HistoryPanel token={token} />}
              {activeTab === "chat" && (
                <ChatPanel
                  token={token}
                  currentUser={user}
                  filters={debouncedFilters}
                />
              )}
              {activeTab === "notifications" && (
                <NotificationsPanel token={token} />
              )}
              {activeTab === "events" && <EventsPanel />}
              {activeTab === "reports" && <ReportsPanel token={token} />}
            </section>
            {needsPagination && (
              <footer className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={meta.total_pages || 1}
                  onPageChange={setCurrentPage}
                  totalRecords={meta.total_records}
                  currentCount={users.length}
                  unit="users"
                />
              </footer>
            )}
          </div>
        </Suspense>
        {showUserForm && (
          <Suspense fallback={null}>
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <UserForm
                onSubmit={handleCreateUser}
                onClose={() => {
                  setShowUserForm(false);
                  setEditingUser(null);
                }}
                initialData={editingUser}
              />
            </div>
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;