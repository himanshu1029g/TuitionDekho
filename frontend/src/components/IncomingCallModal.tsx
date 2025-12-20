import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  caller: any;
  roomId: string;
  onAccept: () => void;
  onReject: () => void;
};

export default function IncomingCallModal({
  open,
  caller,
  roomId,
  onAccept,
  onReject
}: Props) {
  if (!caller) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onReject(); }}>
      <DialogContent className="text-center space-y-4">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold">📞 Incoming Video Call</h2>
          <button aria-label="close" onClick={onReject} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <p className="text-gray-600">{caller.name} is calling you</p>

        <div className="flex justify-center gap-4">
          <Button variant="destructive" onClick={onReject}>
            Reject
          </Button>
          <Button onClick={onAccept}>
            Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
