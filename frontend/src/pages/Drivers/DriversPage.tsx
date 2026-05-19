import { useEffect, useState, useCallback } from "react";
import type { Driver } from "@shared";
import { DataTable } from "@/components/DataTable";
import { getDriverColumns } from "@/components/TableColumns";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/DeleteDialog";
import { FilterDriverModal } from "@/components/modals/FilterModal.tsx";
import { CreateDriverModal } from "@/components/modals/CreateModal";
import { EditDriverModal } from "@/components/modals/EditModal";

const DriversPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    license_number: string;
    warningMessage: string | null;
    affectedItems: string[];
    disableConfirm: boolean;
  }>({
    isOpen: false,
    license_number: "",
    warningMessage: null,
    affectedItems: [],
    disableConfirm: false,
  });

  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    driver: Driver | null;
  }>({
    isOpen: false,
    driver: null,
  });

  const handleEditClick = (driver: Driver) => {
    setEditModal({ isOpen: true, driver });
  };

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await api("/drivers");
      if (response.ok) {
        const result = await response.json();
        setDrivers(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleDeleteClick = async (license_number: string) => {
    try {
      const depsResponse = await api(
        `/vehicles/filter/driver?license_number=${license_number}`,
      );
      const violationsResponse = await api(
        `/violations/filter/driver?license_number=${license_number}`,
      );
      let warningMessage = null;
      let affectedItems: string[] = [];
      let disableConfirm = false;

      if (depsResponse.ok) {
        const depsData = await depsResponse.json();
        const vehicles = depsData.data || [];
        const vehiclesCount = vehicles.length;

        if (vehiclesCount > 0) {
          vehicles.forEach((v: any) =>
            affectedItems.push(`Vehicle Plate: ${v.plate_number}`),
          );
          disableConfirm = true;
        }
      }

      if (violationsResponse.ok) {
        const violationsData = await violationsResponse.json();
        const allViolations = violationsData.data || [];
        const violations = allViolations.filter(
          (v: any) => v.violation_status !== "Paid",
        );
        const violationsCount = violations.length;

        if (violationsCount > 0) {
          violations.forEach((v: any) =>
            affectedItems.push(
              `Violation ID ${v.violation_id}: ${v.violation_type} (${v.violation_status})`,
            ),
          );
          disableConfirm = true;
        }
      }

      if (disableConfirm) {
        warningMessage =
          "Deletion is blocked. You cannot delete this driver because they have active registered vehicles or outstanding violations in the system.";
      }

      setDeleteModal({
        isOpen: true,
        license_number,
        warningMessage,
        affectedItems,
        disableConfirm,
      });
    } catch (error) {
      console.error("Failed to check dependencies:", error);
      setDeleteModal({
        isOpen: true,
        license_number,
        warningMessage: null,
        affectedItems: [],
        disableConfirm: false,
      });
    }
  };

  const confirmDelete = async () => {
    const { license_number } = deleteModal;
    setDeleteModal((prev) => ({ ...prev, isOpen: false }));

    try {
      console.log("Delete driver", license_number);
      const response = await api(`/drivers/${license_number}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }

      toast.success("Driver deleted successfully");
      setIsFiltered(false);
      await fetchDrivers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete driver",
      );
    }
  };

  return (
    <div className="w-full space-y-6 p-6">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
        </div>
      ) : (
        <DataTable
          columns={getDriverColumns(handleDeleteClick, handleEditClick)}
          data={drivers}
          title="Drivers"
          isFiltered={isFiltered}
          onFilterClick={() => setFilterModalOpen(true)}
          onAddNewClick={() => setCreateModalOpen(true)}
        />
      )}

      <DeleteDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        entityName="Driver"
        entityId={deleteModal.license_number}
        warningMessage={deleteModal.warningMessage}
        affectedItems={deleteModal.affectedItems}
        disableConfirm={deleteModal.disableConfirm}
      />

      <FilterDriverModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onResults={(filtered) => {
          setDrivers(filtered);
          setIsFiltered(true);
        }}
        onReset={() => {
          setIsFiltered(false);
          fetchDrivers();
        }}
      />

      <CreateDriverModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setIsFiltered(false);
          fetchDrivers();
        }}
      />

      {editModal.driver && (
        <EditDriverModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, driver: null })}
          onSuccess={() => {
            setIsFiltered(false);
            fetchDrivers();
          }}
          driver={editModal.driver}
        />
      )}
    </div>
  );
};

export default DriversPage;
