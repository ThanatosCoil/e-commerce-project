import { AlertTriangle, Loader, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onDelete: () => Promise<void> | void;
  isDeleting: boolean;
  title?: string;
  description?: string;
  itemType?: string;
}

const DeleteConfirmationDialog = ({
  isOpen,
  setIsOpen,
  onDelete,
  isDeleting,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemType = "item",
}: DeleteConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800 p-0 overflow-hidden">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-100 dark:border-red-900/50">
          <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold">
            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
            {title}
          </DialogTitle>
        </div>

        <div className="p-5">
          <DialogDescription className="text-base dark:text-gray-300 mb-5 py-2 px-3 border-l-4 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 rounded-r-md">
            {description}
          </DialogDescription>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 hover:from-red-600 hover:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 border-0 shadow-md hover:shadow-lg active:from-red-700 active:to-red-800 active:shadow-inner active:scale-[0.98] transition-all duration-200"
            >
              {isDeleting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin text-white" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  <span>Delete {itemType}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
