"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Users,
  MessageSquare,
  PhoneOff,
  X,
  Send,
  Languages,
  CircleHelp,
} from "lucide-react";
import styles from "./room.module.css";

interface ClassInfo {
  name: string;
  code: string;
}

interface CurrentUser {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  name: string;
  micOn: boolean;
  camOn: boolean;
  avatarUrl?: string;
}

interface CaptionLine {
  id: string;
  text: string;
  time: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

const DEFAULT_CLASS_INFO: ClassInfo = {
  name: "Lớp học chưa có tên",
  code: "XXXX-000",
};

const MOCK_PARTICIPANTS: Participant[] = [
  { id: "gv-1", name: "đ", micOn: true, camOn: true },
  { id: "sv-2", name: "ff", micOn: false, camOn: true },
  { id: "sv-3", name: "Tr", micOn: true, camOn: false },
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function nowLabel() {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClassroomPage() {
  const router = useRouter();

  const [classInfo] = useState<ClassInfo>(DEFAULT_CLASS_INFO);

  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    id: "me",
    name: "ds",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentUser({
          id: parsed.id ?? "me",
          name:
            parsed.fullName ?? parsed.name ?? parsed.username ?? "Sinh viên",
        });
      }
    } catch {
      // Không đọc được thì giữ giá trị mặc định.
    }
  }, []);

  const [participants] = useState<Participant[]>(MOCK_PARTICIPANTS);

  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  async function ensureLocalStream() {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getVideoTracks().forEach((t) => (t.enabled = false));
      stream.getAudioTracks().forEach((t) => (t.enabled = false));
      return stream;
    } catch (err) {
      console.error("Không truy cập được camera/mic:", err);
      return null;
    }
  }

  const toggleCam = async () => {
    const stream = await ensureLocalStream();
    if (!stream) return;
    const next = !camOn;
    stream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  };

  const toggleMic = async () => {
    const stream = await ensureLocalStream();
    if (!stream) return;
    const next = !micOn;
    stream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  };

  const [isSharing, setIsSharing] = useState(false);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const toggleShare = async () => {
    if (isSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsSharing(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        screenStreamRef.current = null;
        setIsSharing(false);
      });
      setIsSharing(true);
    } catch (err) {
      console.error("Không chia sẻ được màn hình:", err);
    }
  };

  const [captionsVN, setCaptionsVN] = useState<CaptionLine[]>([]);
  const [captionsEN, setCaptionsEN] = useState<CaptionLine[]>([]);

  function addCaptionLine(lang: "vi" | "en", text: string) {
    const line: CaptionLine = {
      id: crypto.randomUUID(),
      text,
      time: nowLabel(),
    };
    if (lang === "vi") setCaptionsVN((prev) => [...prev, line]);
    else setCaptionsEN((prev) => [...prev, line]);
  }

  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [questions, setQuestions] = useState<ChatMessage[]>([]);
  const [questionInput, setQuestionInput] = useState("");

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: currentUser.name,
        text,
        time: nowLabel(),
      },
    ]);
    setChatInput("");
  };

  const handleSendQuestion = (e: FormEvent) => {
    e.preventDefault();
    const text = questionInput.trim();
    if (!text) return;
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: currentUser.name,
        text,
        time: nowLabel(),
      },
    ]);
    setQuestionInput("");
  };

  const handleLeave = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    window.location.assign("/home");
  };

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const [showQuestion, setShowQuestion] = useState(false);
  const [showLeavePopup, setShowLeavePopup] = useState(false);

  return (
    <div className={styles.container}>
      {/* ===================== HEADER ===================== */}
      {/* ĐÃ SỬA: header giờ chỉ còn 3 phần — logo, tên/mã lớp (giữa), tài khoản (phải).
          Dải camera đã được chuyển ra khỏi header, xem khối .cameraBar ngay bên dưới. */}
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <img src="/Ai.png" alt="ClassBridge AI" className={styles.logo} />
          <span className={styles.brandName}>
            ClassBridge <span className={styles.brandAccent}>AI</span>
          </span>
        </div>

        <div className={styles.classInfo}>
          <span className={styles.className}>{classInfo.name}</span>
          <span className={styles.classCode}>Mã lớp: {classInfo.code}</span>
        </div>

        <div
          className={styles.accountBadge}
          onClick={() => setShowAccountMenu((v) => !v)}
        >
          <div className={styles.avatarCircle}>
            {getInitials(currentUser.name)}
          </div>
          <span className={styles.accountName}>{currentUser.name}</span>

          {showAccountMenu && (
            <div className={styles.accountMenu}>
              <button
                type="button"
                className={styles.accountMenuItem}
                onClick={() => {
                  localStorage.removeItem("user");
                  router.push("/login");
                }}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>

      <div className={styles.cameraBar}>
        <div className={styles.miniTile}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`${styles.miniVideo} ${camOn ? "" : styles.hidden}`}
          />
          {!camOn && (
            <div className={styles.miniAvatarFallback}>
              {getInitials(currentUser.name)}
            </div>
          )}
          <span className={styles.miniName}>{currentUser.name} (Bạn)</span>
          {!micOn && <MicOff size={11} className={styles.miniMuteIcon} />}
        </div>

        {participants.map((p) => (
          <div key={p.id} className={styles.miniTile}>
            {p.camOn ? (
              <div className={styles.miniAvatarFallback}>
                {getInitials(p.name)}
              </div>
            ) : (
              <div className={styles.miniAvatarFallback}>
                {getInitials(p.name)}
              </div>
            )}
            <span className={styles.miniName}>{p.name}</span>
            {!p.micOn && <MicOff size={11} className={styles.miniMuteIcon} />}
          </div>
        ))}
      </div>

      <div className={styles.mainArea}>
        <div className={styles.stage}>
          {isSharing ? (
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              className={styles.stageVideo}
            />
          ) : (
            <div className={styles.stagePlaceholder}>
              <ScreenShare size={40} />
              <p>Chưa có ai chia sẻ màn hình</p>
            </div>
          )}
        </div>

        <aside className={styles.captionPanel}>
          <div className={styles.captionBox}>
            <div className={styles.captionHeader}>
              <Languages size={14} /> English
            </div>
            <div className={styles.captionBody}>
              {captionsVN.length === 0 ? (
                <p className={styles.captionEmpty}>Chưa có phụ đề...</p>
              ) : (
                captionsVN.map((c) => (
                  <p key={c.id} className={styles.captionLine}>
                    {c.text}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className={styles.captionBox}>
            <div className={styles.captionHeader}>
              <Languages size={14} /> VietNamese
            </div>
            <div className={styles.captionBody}>
              {captionsEN.length === 0 ? (
                <p className={styles.captionEmpty}>No captions yet...</p>
              ) : (
                captionsEN.map((c) => (
                  <p key={c.id} className={styles.captionLine}>
                    {c.text}
                  </p>
                ))
              )}
            </div>
          </div>
        </aside>

        {showParticipants && (
          <aside className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h3>Người tham gia ({participants.length + 1})</h3>
              <button type="button" onClick={() => setShowParticipants(false)}>
                <X size={16} />
              </button>
            </div>
            <ul className={styles.participantList}>
              <li className={styles.participantItem}>
                <div className={styles.avatarCircle}>
                  {getInitials(currentUser.name)}
                </div>
                <span>{currentUser.name} (Bạn)</span>
                <div className={styles.participantIcons}>
                  {micOn ? <Mic size={14} /> : <MicOff size={14} />}
                  {camOn ? <Video size={14} /> : <VideoOff size={14} />}
                </div>
              </li>
              {participants.map((p) => (
                <li key={p.id} className={styles.participantItem}>
                  <div className={styles.avatarCircle}>
                    {getInitials(p.name)}
                  </div>
                  <span>{p.name}</span>
                  <div className={styles.participantIcons}>
                    {p.micOn ? <Mic size={14} /> : <MicOff size={14} />}
                    {p.camOn ? <Video size={14} /> : <VideoOff size={14} />}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {showChat && (
          <aside className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h3>Trò chuyện</h3>
              <button type="button" onClick={() => setShowChat(false)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.chatMessages}>
              {messages.length === 0 ? (
                <p className={styles.captionEmpty}>Chưa có tin nhắn nào.</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={styles.chatMessage}>
                    <span className={styles.chatSender}>
                      {m.sender} · {m.time}
                    </span>
                    <p className={styles.chatText}>{m.text}</p>
                  </div>
                ))
              )}
            </div>
            <form className={styles.chatInputRow} onSubmit={handleSendMessage}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className={styles.chatInput}
              />
              <button
                type="submit"
                className={styles.chatSendBtn}
                aria-label="Gửi"
              >
                <Send size={16} />
              </button>
            </form>
          </aside>
        )}

        {showQuestion && (
          <aside className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h3>Câu hỏi</h3>
              <button type="button" onClick={() => setShowQuestion(false)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.chatMessages}>
              {questions.length === 0 ? (
                <p className={styles.captionEmpty}>Chưa có câu hỏi nào.</p>
              ) : (
                questions.map((question) => (
                  <div key={question.id} className={styles.chatMessage}>
                    <span className={styles.chatSender}>
                      {question.sender} · {question.time}
                    </span>
                    <p className={styles.chatText}>{question.text}</p>
                  </div>
                ))
              )}
            </div>
            <form className={styles.chatInputRow} onSubmit={handleSendQuestion}>
              <input
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Nhập câu hỏi..."
                className={styles.chatInput}
              />
              <button
                type="submit"
                className={styles.chatSendBtn}
                aria-label="Gửi câu hỏi"
              >
                <Send size={16} />
              </button>
            </form>
          </aside>
        )}
      </div>

      <footer className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.toolBtn} ${!micOn ? styles.toolBtnOff : ""}`}
          onClick={toggleMic}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          <span>Mic</span>
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${!camOn ? styles.toolBtnOff : ""}`}
          onClick={toggleCam}
        >
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
          <span>{camOn ? "Tắt cam" : "Bật cam"}</span>
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${isSharing ? styles.toolBtnActive : ""}`}
          onClick={toggleShare}
        >
          <ScreenShare size={20} />
          <span>{isSharing ? "Dừng share" : "Share"}</span>
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${showParticipants ? styles.toolBtnActive : ""}`}
          onClick={() => {
            setShowParticipants((v) => !v);
            setShowChat(false);
            setShowQuestion(false);
          }}
        >
          <Users size={20} />
          <span>Participants</span>
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${showChat ? styles.toolBtnActive : ""}`}
          onClick={() => {
            setShowChat((v) => !v);
            setShowParticipants(false);
            setShowQuestion(false);
          }}
        >
          <MessageSquare size={20} />
          <span>Message</span>
        </button>

        <button
          type="button"
          className={`${styles.toolBtn} ${showQuestion ? styles.toolBtnActive : ""}`}
          onClick={() => {
            setShowQuestion((v) => !v);
            setShowChat(false);
            setShowParticipants(false);
          }}
        >
          <CircleHelp size={20} />
          <span>Câu hỏi</span>
        </button>
        <div className={styles.leaveWrapper}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => setShowLeavePopup((prev) => !prev)}
          >
            <PhoneOff size={20} />
            <span>Leave</span>
          </button>
          {showLeavePopup && (
            <div className={styles.leaveMenu}>
              <button
                type="button"
                className={styles.leaveMeetingBtn}
                onClick={handleLeave}
              >
                Leave meeting
              </button>
              <button
                type="button"
                className={styles.cancelLeaveBtn}
                onClick={() => setShowLeavePopup(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
