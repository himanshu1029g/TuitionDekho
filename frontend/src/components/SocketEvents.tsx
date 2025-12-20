import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import IncomingCallModal from "./IncomingCallModal";
import { toast } from "sonner";

export default function SocketEvents() {
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    const onIncomingCall = ({ fromUser, roomId }: any) => {
      setIncomingCall({ fromUser, roomId });
      // notify header badge
      try {
        window.dispatchEvent(new CustomEvent('notifications:changed', { detail: { increment: 1, notification: { _id: `local-call-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, title: 'Incoming call', text: `${fromUser?.name} is calling`, createdAt: Date.now() } } }));
      } catch (e) {}
    };

    const onNewMessage = (msg: any) => {
      // lightweight notification for messages
      toast(`${msg?.text || 'New message'}`, { description: msg?.senderName || undefined });
      try {
        window.dispatchEvent(new CustomEvent('notifications:changed', { detail: { increment: 1, notification: { _id: `local-msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, title: 'Message', text: msg?.text || 'New message', senderName: msg?.senderName, createdAt: Date.now() } } }));
      } catch (e) {}
    };

    socket.on("incoming-call", onIncomingCall);
    socket.on("new-message", onNewMessage);

    return () => {
      socket.off("incoming-call", onIncomingCall);
      socket.off("new-message", onNewMessage);
    };
  }, []);

  const acceptCall = () => {
    // tell the caller the callee accepted
    socket.emit("call-accepted", {
      toUserId: incomingCall.fromUser.id,
      roomId: incomingCall.roomId
    });

    const roomName = incomingCall.roomId;
    const jitsiUrl = `https://meet.jit.si/${roomName}`;
    window.open(jitsiUrl, "_blank");
    setIncomingCall(null);
  };

  const rejectCall = () => {
    socket.emit("call-rejected", {
      toUserId: incomingCall.fromUser.id
    });

    setIncomingCall(null);
  };

  return (
    <IncomingCallModal
      open={!!incomingCall}
      caller={incomingCall?.fromUser}
      roomId={incomingCall?.roomId}
      onAccept={acceptCall}
      onReject={rejectCall}
    />
  );
}
