import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  callee: any;
  onCancel: () => void;
};

export default function OutgoingCallModal({ open, callee, onCancel }: Props) {
  if (!callee) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="text-center space-y-4">
        <h2 className="text-xl font-semibold">📞 Calling</h2>
        <p className="text-gray-600">Calling {callee.name}…</p>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
