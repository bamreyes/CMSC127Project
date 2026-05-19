import { useEffect, useState, useCallback } from "react";
import type { Vehicle } from "@shared";
import { DataTable } from "@/components/DataTable";
import { getVehicleColumns } from "@/components/TableColumns";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/DeleteDialog";
import { FilterVehicleModal } from "@/components/modals/FilterModal";
import { CreateVehicleModal } from "@/components/modals/CreateModal";
import { EditVehicleModal } from "@/components/modals/EditModal";

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    plate_number: string;
    warningMessage: string | null;
    affectedItems: string[];
    disableConfirm: boolean;
  }>({
    isOpen: false,
    plate_number: "",
    warningMessage: null,
    affectedItems: [],
    disableConfirm: false,
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    vehicle: Vehicle | null;
  }>({
    isOpen: false,
    vehicle: null,
  });

  const fetchVehicles = useCallback(async () => {
    try {
      const vehRes = await api("/vehicles");
      if (vehRes.ok) {
        const vehResult = await vehRes.json();
        setVehicles(vehResult.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleDeleteClick = (plate_number: string) => {
    try {
      const vehicle = vehicles.find(
        (v) => v.plate_number?.toUpperCase() === plate_number.toUpperCase(),
      );
      if (!vehicle) {
        throw new Error("Vehicle not found in state");
      }

      const regs = vehicle.registrations || [];
      const violationsList = vehicle.violations || [];

      let warningMessage = null;
      let affectedItems: string[] = [];
      let disableConfirm = false;
      let activeItemsList: string[] = [];
      let expiredItemsList: string[] = [];

      const regsList = Array.isArray(regs)
        ? regs
        : (regs as any).registration_number
          ? [regs]
          : [];

      const activeRegs = regsList.filter((r: any) => {
        const isStatusActive = r.registration_status === "Active";
        const isNotExpired = new Date(r.expiration_date) > new Date();
        return isStatusActive && isNotExpired;
      });

      const expiredRegs = regsList.filter((r: any) => {
        const isStatusActive = r.registration_status === "Active";
        const isNotExpired = new Date(r.expiration_date) > new Date();
        return !isStatusActive || !isNotExpired;
      });

      if (activeRegs.length > 0) {
        activeRegs.forEach((r: any) =>
          activeItemsList.push(
            `Active Registration No: ${r.registration_number} (Expires: ${new Date(r.expiration_date).toISOString().slice(0, 10)})`,
          ),
        );
        disableConfirm = true;
      }

      if (expiredRegs.length > 0) {
        expiredRegs.forEach((r: any) =>
          expiredItemsList.push(
            `Expired Registration No: ${r.registration_number} (Expired: ${new Date(r.expiration_date).toISOString().slice(0, 10)})`,
          ),
        );
      }

      const outstandingViolations = violationsList.filter(
        (v: any) => v.violation_status !== "Paid",
      );
      const violationsCount = outstandingViolations.length;

      if (violationsCount > 0) {
        outstandingViolations.forEach((v: any) =>
          activeItemsList.push(
            `Violation ID ${v.violation_id}: ${v.violation_type} (${v.violation_status})`,
          ),
        );
        disableConfirm = true;
      }

      if (disableConfirm) {
        affectedItems = activeItemsList;
        warningMessage =
          "Deletion is restricted. This vehicle has an active registration or outstanding traffic violations associated with it in the system. Active registrations must expire before deletion is allowed.";
      } else {
        affectedItems = expiredItemsList;
        if (expiredItemsList.length > 0) {
          warningMessage =
            "This vehicle has expired registrations. Deleting the vehicle will automatically clean up these expired records. Are you sure you want to proceed?";
        }
      }

      setDeleteModal({
        isOpen: true,
        plate_number,
        warningMessage,
        affectedItems,
        disableConfirm,
      });
    } catch (error) {
      console.error("Failed to check vehicle dependencies:", error);
      setDeleteModal({
        isOpen: true,
        plate_number,
        warningMessage: null,
        affectedItems: [],
        disableConfirm: false,
      });
    }
  };

  const confirmDelete = async () => {
    const { plate_number } = deleteModal;
    setDeleteModal((prev) => ({ ...prev, isOpen: false }));
    try {
      const response = await api(`/vehicles/${plate_number}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }
      toast.success("Vehicle deleted successfully");
      setIsFiltered(false);
      await fetchVehicles();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete vehicle",
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
          columns={getVehicleColumns(handleDeleteClick, (v) =>
            setEditModal({ isOpen: true, vehicle: v }),
          )}
          data={vehicles}
          title="Vehicles"
          isFiltered={isFiltered}
          onFilterClick={() => setFilterModalOpen(true)}
          onAddNewClick={() => setCreateModalOpen(true)}
        />
      )}

      <DeleteDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        entityName="Vehicle"
        entityId={deleteModal.plate_number}
        warningMessage={deleteModal.warningMessage}
        affectedItems={deleteModal.affectedItems}
        disableConfirm={deleteModal.disableConfirm}
      />

      <FilterVehicleModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onResults={(filtered) => {
          setVehicles(filtered);
          setIsFiltered(true);
        }}
        onReset={() => {
          setIsFiltered(false);
          fetchVehicles();
        }}
      />

      <CreateVehicleModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setIsFiltered(false);
          fetchVehicles();
        }}
      />

      {editModal.vehicle && (
        <EditVehicleModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, vehicle: null })}
          onSuccess={() => {
            setIsFiltered(false);
            fetchVehicles();
          }}
          vehicle={editModal.vehicle}
        />
      )}
    </div>
  );
};

export default VehiclesPage;
