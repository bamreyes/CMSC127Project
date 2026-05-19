import { useEffect, useState, useCallback } from "react";
import type { TrafficViolation } from "@shared";
import { DataTable } from "@/components/DataTable";
import { getViolationColumns } from "@/components/TableColumns";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/DeleteDialog";
import { FilterViolationModal } from "@/components/modals/FilterModal";
import { CreateViolationModal } from "@/components/modals/CreateModal";
import { EditViolationModal } from "@/components/modals/EditModal";

const ViolationsPage = () => {
  const [violations, setViolations] = useState<TrafficViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    violation_id: string | number;
  }>({
    isOpen: false,
    violation_id: "",
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    violation: TrafficViolation | null;
  }>({
    isOpen: false,
    violation: null,
  });

  const fetchViolations = useCallback(async () => {
    try {
      const [violRes, drvRes] = await Promise.all([
        api("/violations"),
        api("/drivers"),
      ]);

      if (violRes.ok && drvRes.ok) {
        const violResult = await violRes.json();
        const drvResult = await drvRes.json();

        const drivers = drvResult.data || [];
        const mapped = (violResult.data || []).map((v: any) => ({
          ...v,
          violator_name: drivers.find(
            (d: any) =>
              d.license_number?.toUpperCase() ===
              v.license_number?.toUpperCase(),
          )?.full_name,
        }));

        setViolations(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch violations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  const handleDeleteClick = (violation_id: string | number) => {
    setDeleteModal({ isOpen: true, violation_id });
  };

  const confirmDelete = async () => {
    const { violation_id } = deleteModal;
    setDeleteModal((prev) => ({ ...prev, isOpen: false }));
    try {
      const response = await api(`/violations/${violation_id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }
      toast.success("Violation deleted successfully");
      setIsFiltered(false);
      await fetchViolations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete violation",
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
          columns={getViolationColumns(handleDeleteClick, (v) =>
            setEditModal({ isOpen: true, violation: v }),
          )}
          data={violations}
          title="Violations"
          isFiltered={isFiltered}
          onFilterClick={() => setFilterModalOpen(true)}
          onAddNewClick={() => setCreateModalOpen(true)}
        />
      )}

      <DeleteDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        entityName="Violation"
        entityId={deleteModal.violation_id}
      />

      <FilterViolationModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onResults={(filtered) => {
          setViolations(filtered);
          setIsFiltered(true);
        }}
        onReset={() => {
          setIsFiltered(false);
          fetchViolations();
        }}
      />

      <CreateViolationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setIsFiltered(false);
          fetchViolations();
        }}
      />

      {editModal.violation && (
        <EditViolationModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, violation: null })}
          onSuccess={() => {
            setIsFiltered(false);
            fetchViolations();
          }}
          violation={editModal.violation}
        />
      )}
    </div>
  );
};

export default ViolationsPage;
