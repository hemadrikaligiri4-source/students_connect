import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  Infinity, BookOpen, Users, UserCheck, MessageSquare, 
  Tv2, Award, ShieldAlert, LogOut, Search, Plus, PlusCircle,
  Check, X, Send, Video, ScreenShare, Sparkles, 
  Flame, CheckCircle, HelpCircle, Heart, MessageCircle, 
  Activity, GraduationCap, ChevronRight, Ban, Trophy, Coins,
  Volume2, VolumeX, Share2, Disc, Music, ChevronUp, ChevronDown
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- AUTHENTICATION & CLIENT SETUP ---
// Dynamic initialization: Fallback to simulated developer mode if Supabase keys are blank
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  // Auto-login configuration for simulated developer mode
  const testAccounts = [
    { 
      email: 'studenta@student.com', 
      role: 'authenticated', 
      id: '11111111-1111-1111-1111-111111111111', 
      fullName: 'Aarav Sharma',
      college: 'IIT Madras',
      department: 'Computer Science',
      year: 2,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav'
    },
    { 
      email: 'studentb@student.com', 
      role: 'authenticated', 
      id: '22222222-2222-2222-2222-222222222222', 
      fullName: 'Bhavna Patel',
      college: 'IIT Bombay',
      department: 'Information Tech',
      year: 3,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bhavna'
    },
    { 
      email: 'studentc@student.com', 
      role: 'authenticated', 
      id: '33333333-3333-3333-3333-333333333333', 
      fullName: 'Chaitanya Reddy',
      college: 'BITS Pilani',
      department: 'Electrical Eng',
      year: 4,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chaitanya'
    }
  ];

  useEffect(() => {
    if (supabase) {
      // Real Supabase Auth Flow
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
          setToken(session.access_token);
          fetchProfile(session.user.id, session.access_token);
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setUser(session.user);
          setToken(session.access_token);
          fetchProfile(session.user.id, session.access_token);
        } else {
          setUser(null);
          setProfile(null);
          setToken('');
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Mock developer mode check
      const cached = localStorage.getItem('studyloop_mock_session');
      if (cached) {
        const mockUser = JSON.parse(cached);
        setUser(mockUser);
        // Generate a mock JWT payload for developers
        const mockJwt = btoa(JSON.stringify({ sub: mockUser.id, email: mockUser.email, role: mockUser.role })) + ".payload.signature";
        setToken(mockJwt);
        fetchProfile(mockUser.id, mockJwt);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchProfile = async (userId, jwtToken) => {
    try {
      const response = await fetch(`/api/profiles/me`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const loginSimulated = (email) => {
    const acc = testAccounts.find(t => t.email.toLowerCase() === email.toLowerCase());
    if (acc) {
      const mockUserObj = { id: acc.id, email: acc.email, role: acc.role };
      localStorage.setItem('studyloop_mock_session', JSON.stringify(mockUserObj));
      setUser(mockUserObj);
      const mockJwt = btoa(JSON.stringify({ sub: acc.id, email: acc.email, role: acc.role })) + ".payload.signature";
      setToken(mockJwt);
      fetchProfile(acc.id, mockJwt);
    } else {
      alert("Invalid developer email selected.");
    }
  };

  const logout = async () => {
    setLoading(true);
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('studyloop_mock_session');
      setUser(null);
      setProfile(null);
      setToken('');
      setLoading(false);
    }
  };

  const updateProfileState = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, loginSimulated, logout, updateProfileState, fetchProfile, testAccounts, isMockMode: !supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// --- MAIN APPLICATION LAYOUT ---
export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

function MainLayout() {
  const { user, profile, token, loading, logout, loginSimulated, testAccounts, isMockMode } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');
  const [activeRoomId, setActiveRoomId] = useState(null); // active Doubt Room currently joined
  const [activeChatId, setActiveChatId] = useState(null); // active 1:1 chat thread currently joined
  const [chatPeer, setChatPeer] = useState(null); // other user details for active 1:1 chat
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  
  // Real-time connections & WebRTC states
  const [socket, setSocket] = useState(null);
  const [wsMessages, setWsMessages] = useState([]);
  const [webrtcCall, setWebrtcCall] = useState(null); // active call object
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const peerConnection = useRef(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Initialize WebSocket connection on login
  useEffect(() => {
    if (!token) return;

    // Establish WebSocket using path matching our proxy /ws/chat
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setSocket(ws);
      // Start heartbeat
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
        }
      }, 30000);
      return () => clearInterval(interval);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("WebSocket incoming:", payload);

        // Handle WebRTC Signaling relay (Section 6)
        if (payload.type === 'RTC_SIGNAL' && payload.signalData) {
          handleIncomingRtcSignal(payload);
        } else {
          // Log general message for chat rooms
          setWsMessages(prev => [...prev, payload]);
        }
      } catch (e) {
        console.error("WS parse error:", e);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, [token]);

  // WebRTC Signaling Handlers (Section 6)
  const startWebRtcCall = async (targetUserId, doubtRoomId = null) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.send(JSON.stringify({
            type: 'RTC_SIGNAL',
            targetUserId: targetUserId,
            roomId: doubtRoomId,
            signalData: { candidate: event.candidate }
          }));
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.send(JSON.stringify({
          type: 'RTC_SIGNAL',
          targetUserId: targetUserId,
          roomId: doubtRoomId,
          signalData: { sdp: offer }
        }));
      }

      peerConnection.current = pc;
      setWebrtcCall({ peerId: targetUserId, isIncoming: false, roomId: doubtRoomId });
    } catch (e) {
      console.error("WebRTC getUserMedia error:", e);
      alert("Failed to access camera/microphone. Check browser permissions.");
    }
  };

  const handleIncomingRtcSignal = async (payload) => {
    const { senderId, signalData, roomId } = payload;
    let pc = peerConnection.current;

    if (signalData.sdp) {
      if (signalData.sdp.type === 'offer') {
        // Automatically accept or show prompt. In peer MVP, auto-connect to simplify flow
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.send(JSON.stringify({
              type: 'RTC_SIGNAL',
              targetUserId: senderId,
              roomId: roomId,
              signalData: { candidate: event.candidate }
            }));
          }
        };

        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socket) {
          socket.send(JSON.stringify({
            type: 'RTC_SIGNAL',
            targetUserId: senderId,
            roomId: roomId,
            signalData: { sdp: answer }
          }));
        }

        peerConnection.current = pc;
        setWebrtcCall({ peerId: senderId, isIncoming: true, roomId: roomId });
      } else if (signalData.sdp.type === 'answer') {
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        }
      }
    } else if (signalData.candidate) {
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnection.current) return;
    try {
      if (isScreenSharing) {
        // Switch back to video camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsScreenSharing(false);
      } else {
        // Grab screen share stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
        
        // Listen for screen sharing stop
        screenTrack.onended = () => {
          toggleScreenShare(); // revert
        };
        
        setLocalStream(screenStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
      }
    } catch (e) {
      console.error("Screen sharing failed:", e);
    }
  };

  const hangUpCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setWebrtcCall(null);
    setIsScreenSharing(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcfbfc' }}>
        <Infinity size={48} className="live-dot" style={{ color: '#d97706', marginBottom: '1rem' }} />
        <h2 className="font-serif" style={{ fontSize: '1.5rem' }}>Loading StudyLoop...</h2>
      </div>
    );
  }

  // --- LANDING / FIRST PAGE FOR VISITORS ---
  if (!user) {
    return (
      <LandingScreen setActiveTab={setActiveTab} loginSimulated={loginSimulated} testAccounts={testAccounts} />
    );
  }

  // Set default college warning if profile exists but doesn't have college set
  const showCollegeWarning = profile && !profile.college && activeTab !== 'dashboard';

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <nav className="sidebar" style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem', cursor: 'pointer' }} onClick={() => setActiveTab('landing')}>
          <Infinity size={28} style={{ color: '#d97706' }} />
          <span className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>StudyLoop</span>
        </div>

        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <img src={profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.fullName}`} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{profile.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                <Flame size={12} fill="#d97706" /> {profile.xp} XP • Lvl {profile.level}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
          <SidebarLink active={activeTab === 'landing'} icon={<Infinity size={18} />} label="First Page (Landing)" onClick={() => { setActiveTab('landing'); setActiveRoomId(null); }} />
          <SidebarLink active={activeTab === 'feed'} icon={<BookOpen size={18} />} label="Home Feed" onClick={() => { setActiveTab('feed'); setActiveRoomId(null); }} />
          <SidebarLink active={activeTab === 'dashboard'} icon={<Award size={18} />} label="Dashboard & Badges" onClick={() => { setActiveTab('dashboard'); setActiveRoomId(null); }} />
          <SidebarLink active={activeTab === 'leaderboard'} icon={<Trophy size={18} />} label="Campus Leaderboard" onClick={() => { setActiveTab('leaderboard'); setActiveRoomId(null); }} />
          <SidebarLink active={activeTab === 'discover'} icon={<Users size={18} />} label="Discover Peers" onClick={() => { setActiveTab('discover'); setActiveRoomId(null); }} />
          <SidebarLink active={activeTab === 'connections'} icon={<UserCheck size={18} />} label="My Connections" onClick={() => { setActiveTab('connections'); setActiveRoomId(null); }} />
          <SidebarLink active={activeTab === 'doubts'} icon={<HelpCircle size={18} />} label="Doubt Rooms" onClick={() => { setActiveTab('doubts'); setActiveRoomId(null); }} />
          <SidebarLink active={activeTab === 'chat'} icon={<MessageSquare size={18} />} label="Direct Messages" onClick={() => { setActiveTab('chat'); setActiveRoomId(null); }} />
          <SidebarLink active={activeTab === 'reels'} icon={<Tv2 size={18} />} label="Educational Reels" onClick={() => { setActiveTab('reels'); setActiveRoomId(null); }} />
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: 'auto' }}>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent', padding: '0.5rem' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      {/* MAIN SCREEN DISPATCHER WITH TOP FAR-RIGHT USER CORNER */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
        
        {/* TOP FAR-RIGHT USER CORNER BAR */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 2rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={16} style={{ color: '#d97706' }} />
            <span>{profile?.college || 'IIT Madras'} • {profile?.department || 'Computer Science'}</span>
          </div>

          {/* FAR RIGHT USER DROPDOWN CHIP */}
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setShowHeaderDropdown(prev => !prev)}
              className="card-premium glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.375rem 0.875rem',
                borderRadius: '50px',
                cursor: 'pointer',
                border: '1px solid #e2e8f0'
              }}
            >
              <img 
                src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.fullName}`} 
                alt="Avatar" 
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #d97706', objectFit: 'cover' }} 
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                  {profile?.fullName || 'Aarav Sharma'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#d97706', fontWeight: 600 }}>
                  ⚡ {profile?.xp || 650} XP • Lvl {profile?.level || 4}
                </div>
              </div>
              <ChevronDown size={14} style={{ color: '#64748b' }} />
            </button>

            {showHeaderDropdown && (
              <div className="card-premium glass-card" style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                right: 0,
                width: '240px',
                borderRadius: '16px',
                padding: '0.75rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                zIndex: 2000,
                backgroundColor: '#ffffff'
              }}>
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{profile?.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{profile?.college}</div>
                </div>

                <button onClick={() => { setShowHeaderDropdown(false); setActiveTab('dashboard'); }} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                  <Award size={14} style={{ color: '#d97706' }} /> Dashboard & Badges
                </button>

                <button onClick={() => { setShowHeaderDropdown(false); setActiveTab('dashboard'); }} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                  <GraduationCap size={14} style={{ color: '#0284c7' }} /> Edit Profile / Settings
                </button>

                <div style={{ margin: '0.375rem 0', borderTop: '1px solid #f1f5f9', paddingTop: '0.375rem' }}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8', padding: '0.25rem 0.75rem', textTransform: 'uppercase' }}>
                    Switch Account
                  </div>
                  {testAccounts.map(acc => (
                    <button 
                      key={acc.id}
                      onClick={() => { loginSimulated(acc.email); setShowHeaderDropdown(false); setActiveTab('dashboard'); }}
                      style={{ width: '100%', padding: '0.375rem 0.75rem', borderRadius: '6px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#475569' }}
                    >
                      <img src={acc.avatarUrl} alt="Avatar" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                      {acc.fullName}
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.375rem', marginTop: '0.25rem' }}>
                  <button onClick={() => { logout(); setShowHeaderDropdown(false); }} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: '#fef2f2', color: '#dc2626', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showCollegeWarning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <ShieldAlert style={{ color: '#d97706' }} />
            <div>
              <strong>Complete your profile setup:</strong> Set your college name in the <strong>Dashboard</strong> to view and join live Doubt Rooms from your campus!
            </div>
            <button className="btn btn-primary" onClick={() => setActiveTab('dashboard')} style={{ marginLeft: 'auto', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>Go to Dashboard</button>
          </div>
        )}

        {/* Dynamic call UI overlay */}
        {webrtcCall && (
          <RtcCallOverlay 
            localVideoRef={localVideoRef} 
            remoteVideoRef={remoteVideoRef} 
            isScreenSharing={isScreenSharing} 
            toggleScreenShare={toggleScreenShare} 
            hangUpCall={hangUpCall} 
            webrtcCall={webrtcCall} 
            localStream={localStream}
            remoteStream={remoteStream}
          />
        )}

        {activeTab === 'landing' && <LandingScreen setActiveTab={setActiveTab} loginSimulated={loginSimulated} testAccounts={testAccounts} />}
        {activeTab === 'feed' && <FeedScreen setActiveTab={setActiveTab} setActiveRoomId={setActiveRoomId} token={token} />}
        {activeTab === 'dashboard' && <DashboardScreen token={token} />}
        {activeTab === 'leaderboard' && <LeaderboardScreen token={token} />}
        {activeTab === 'discover' && <DiscoverScreen token={token} setActiveTab={setActiveTab} setActiveChatId={setActiveChatId} setChatPeer={setChatPeer} />}
        {activeTab === 'connections' && <ConnectionsScreen token={token} setActiveTab={setActiveTab} setActiveChatId={setActiveChatId} setChatPeer={setChatPeer} />}
        {activeTab === 'doubts' && (
          <DoubtRoomsScreen 
            token={token} 
            activeRoomId={activeRoomId} 
            setActiveRoomId={setActiveRoomId} 
            socket={socket} 
            wsMessages={wsMessages} 
            setWsMessages={setWsMessages}
            startWebRtcCall={startWebRtcCall}
            webrtcCall={webrtcCall}
          />
        )}
        {activeTab === 'chat' && (
          <ChatScreen 
            token={token} 
            activeChatId={activeChatId} 
            setActiveChatId={setActiveChatId} 
            chatPeer={chatPeer} 
            setChatPeer={setChatPeer}
            socket={socket}
            wsMessages={wsMessages}
            setWsMessages={setWsMessages}
          />
        )}
        {activeTab === 'reels' && <ReelsScreen token={token} />}
      </main>
    </div>
  );
}

function SidebarLink({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      width: '100%',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: active ? 600 : 500,
      backgroundColor: active ? '#fef3c7' : 'transparent',
      color: active ? '#b45309' : '#475569',
      textAlign: 'left',
      transition: 'all 0.15s ease'
    }}>
      <span style={{ color: active ? '#b45309' : '#64748b' }}>{icon}</span>
      {label}
    </button>
  );
}

// --- AUTH SCREEN COMPONENT ---
function AuthScreen({ loginSimulated, testAccounts, isMockMode }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    if (isMockMode) {
      // Automatic developer mode login
      loginSimulated(email);
    } else {
      // Real Supabase Auth Flow
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setSuccessMsg("We sent a magic link / OTP to your email! Please check your inbox to log in.");
      } catch (err) {
        alert("Authentication failed: " + err.message);
      }
    }
  };

  const handleOAuth = async () => {
    if (isMockMode) {
      // Log in as Aarav (first profile)
      loginSimulated(testAccounts[0].email);
    } else {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fcfbfc' }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <Infinity size={32} style={{ color: '#d97706' }} />
          <h1 className="font-serif" style={{ fontSize: '1.875rem' }}>StudyLoop</h1>
        </div>

        <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '0.5rem', lineHeight: 1.2 }}>Solve doubts instantly, teach peers together.</h2>
        <p style={{ color: '#586376', fontSize: '0.9375rem', marginBottom: '2rem' }}>The student-to-student live marketplace. Connect with peer mentors on your campus.</p>

        {successMsg ? (
          <div className="card" style={{ backgroundColor: '#d1fae5', borderColor: '#a7f3d0', padding: '1.5rem', textAlign: 'center' }}>
            <CheckCircle size={32} style={{ color: '#059669', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>Check your email</h3>
            <p style={{ fontSize: '0.875rem', color: '#065f46' }}>{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isRegistering && (
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input" placeholder="e.g. Rahul Kumar" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}

            <div>
              <label className="label">College Email Address</label>
              <input type="email" className="input" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-accent" style={{ padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}>
              {isMockMode ? "Launch Startup Developer Login" : "Send Magic OTP"}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', margin: '0.5rem 0' }}>OR</div>

            <button type="button" onClick={handleOAuth} className="btn btn-secondary" style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.68 14.93 1 12 1 7.37 1 3.4 3.68 1.48 7.57l3.77 2.92C6.13 7.3 8.83 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.77 2.92c2.2-2.03 3.62-5.02 3.62-8.63z"/><path fill="#FBBC05" d="M5.25 14.85c-.25-.76-.39-1.57-.39-2.42s.14-1.66.39-2.42L1.48 7.1C.53 9.07 0 11.27 0 12.42s.53 3.35 1.48 5.32l3.77-2.89z"/><path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.77-2.92c-1.05.7-2.4.12-4.19.12-3.17 0-5.87-2.26-6.83-5.32L1.4 14.8c1.92 3.89 5.89 6.2 10.6 6.2z"/></svg>
              Continue with Google
            </button>
          </form>
        )}

        {isMockMode && (
          <div style={{ marginTop: '2.5rem', padding: '1.25rem', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={14} style={{ color: '#d97706' }} /> Developer Test Accounts (Fast Match Seeded)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {testAccounts.map(acc => (
                <button key={acc.email} onClick={() => loginSimulated(acc.email)} className="btn btn-secondary" style={{ fontSize: '0.75rem', justifyContent: 'space-between', padding: '0.5rem 0.75rem' }}>
                  <span><strong>{acc.name}</strong> ({acc.email.split('@')[0]})</span>
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontStyle: 'italic' }}>{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right panel graphic */}
      <div style={{ flex: 1, backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4rem', color: '#ffffff' }}>
        <div style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🤝</div>
          <h2 className="font-serif" style={{ fontSize: '2.25rem', color: '#ffffff', marginBottom: '1rem' }}>Earn while helping</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>StudyLoop tracks solved doubts, peer endorsements, and lesson records to build your expert profile. Showcase your knowledge on the campus leaderboard.</p>
        </div>
      </div>
    </div>
  );
}

// --- SCREEN: HOME FEED (TIMELINE + EXAM RADAR) ---
function FeedScreen({ setActiveTab, setActiveRoomId, token }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const response = await fetch('/api/feed', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFeed(data);
      }
    } catch (e) {
      console.error("Feed error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [token]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.25rem' }}>Your Feed</h1>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>Urgent live doubt rooms and educational shorts scored for you.</p>
        </div>
        <button onClick={fetchFeed} className="btn btn-secondary">Refresh Timeline</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="live-dot" style={{ backgroundColor: '#d97706' }}></div>
        </div>
      ) : feed.length === 0 ? (
        <div className="empty-state">
          <GraduationCap size={48} />
          <h3>Timeline is empty</h3>
          <p>No live doubts or reels match your campus interests. Be the first to start a live session!</p>
          <button onClick={() => setActiveTab('doubts')} className="btn btn-accent"><Plus size={16} /> Ask a Doubt</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {feed.map(item => (
            <div key={item.id} className="card-premium" style={{ position: 'relative' }}>
              {/* Score Display (Startup transparency) */}
              <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  Relevance Score: {item.score}
                </span>
                {item.type === 'DOUBT_ROOM' && (
                  <div className="live-indicator">
                    <span className="live-dot"></span> Live
                  </div>
                )}
              </div>

              {/* Creator details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <img src={item.creator?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${item.creator?.fullName}`} alt="Avatar" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.creator?.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {item.creator?.college} • {item.creator?.department} • Year {item.creator?.year}
                  </div>
                </div>
              </div>

              {/* Content body */}
              {item.type === 'DOUBT_ROOM' ? (
                <div>
                  <h3 className="font-serif" style={{ fontSize: '1.375rem', marginBottom: '0.5rem', color: '#0f172a' }}>{item.title}</h3>
                  <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{item.description}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <span className="tag tag-accent">{item.subject}</span>
                    <button onClick={() => { setActiveRoomId(item.id); setActiveTab('doubts'); }} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                      Join Room & Help
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#0f172a', fontSize: '0.875rem', marginBottom: '1.25rem', fontStyle: 'italic' }}>
                    "Uploaded an educational reel on <strong>{item.subject}</strong>" — {item.description}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Heart size={14} fill="#dc2626" style={{ color: '#dc2626' }} /> {item.reel?.likesCount} likes</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MessageCircle size={14} /> {item.reel?.commentsCount} comments</span>
                    </div>
                    <button onClick={() => setActiveTab('reels')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                      Watch Reel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- INSTAGRAM-STYLE STUDENT PROFILE & MEDIA DASHBOARD ---
function DashboardScreen({ token }) {
  const { updateProfileState } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('posts'); // 'posts', 'reels', 'videos', 'badges'
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [commentText, setCommentText] = useState('');

  // UPLOAD MEDIA CREATOR STUDIO STATES
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState('reel'); // 'reel', 'video', 'post'
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('#Java');
  const [uploadDuration, setUploadDuration] = useState('0:45');
  const [filePreviewUrl, setFilePreviewUrl] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState(1);
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [teachingSkills, setTeachingSkills] = useState('');
  const [learningGoals, setLearningGoals] = useState('');

  // Mock Student Media Datasets (Instagram Reference)
  const [postsList, setPostsList] = useState([
    {
      id: 'post-1',
      title: '🚀 Complete Java Collections Cheat Sheet - HashMaps vs TreeMaps breakdown for mid-terms!',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      likes: 42,
      comments: [
        { author: 'Bhavna Patel', text: 'Super clear diagram! Helped me score A in my lab test.' },
        { author: 'Chaitanya Reddy', text: 'Can you share the PDF link too?' }
      ]
    },
    {
      id: 'post-2',
      title: '📊 Dynamic Programming 101 - Knapsack Problem visual guide with time complexity analysis',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      likes: 89,
      comments: [
        { author: 'Aarav Sharma', text: 'DP tables finally made sense after this post 🔥' }
      ]
    },
    {
      id: 'post-3',
      title: '⚡ 5 React Hooks Mistakes to avoid in your semester project! Save for later 📌',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      likes: 112,
      comments: [
        { author: 'Student Peer', text: 'useEffect dependencies explanation was 10/10!' }
      ]
    }
  ]);

  const [reelsList, setReelsList] = useState([
    {
      id: 'reel-1',
      title: '3 Tricks to solve Recursion problems fast ⚡',
      duration: '0:45',
      views: '1.2k',
      likes: 230,
      hashtag: '#Algorithms',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      comments: [{ author: 'Rahul M.', text: 'Saved to my study playlist!' }]
    },
    {
      id: 'reel-2',
      title: 'Spring Boot Annotations explained in 60s ☕',
      duration: '0:58',
      views: '3.4k',
      likes: 450,
      hashtag: '#Java',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      comments: [{ author: 'Neha S.', text: 'Best 60s summary on @Autowired' }]
    },
    {
      id: 'reel-3',
      title: 'WebRTC Screen Sharing step-by-step 🎥',
      duration: '0:52',
      views: '890',
      likes: 180,
      hashtag: '#WebDev',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      comments: []
    }
  ]);

  const [videosList, setVideosList] = useState([
    {
      id: 'vid-1',
      title: 'Full 45-Min Crash Course: Binary Search Trees & AVL Trees for Campus Placements',
      duration: '42:10',
      views: '5.8k',
      likes: 340,
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      comments: [{ author: 'Priya K.', text: 'Watched before my Google interview prep, super helpful!' }]
    },
    {
      id: 'vid-2',
      title: 'Operating Systems: Thread Synchronization & Deadlock Prevention Masterclass',
      duration: '28:30',
      views: '3.1k',
      likes: 210,
      thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      comments: []
    }
  ]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gamification/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setFullName(result.profile.fullName);
        setCollege(result.profile.college);
        setDepartment(result.profile.department);
        setYear(result.profile.year);
        setBio(result.profile.bio);
        setSkills((result.profile.skills || []).join(', '));
        setTeachingSkills((result.profile.teachingSkills || []).join(', '));
        setLearningGoals((result.profile.learningGoals || []).join(', '));
        setLoading(false);
        return;
      }
    } catch (e) {
      console.log("Using mock dashboard data for student");
    }

    // Mock Fallback Dataset
    const mockData = {
      profile: {
        id: '11111111-1111-1111-1111-111111111111',
        fullName: 'Aarav Sharma',
        college: 'IIT Madras',
        department: 'Computer Science',
        year: 2,
        bio: '🎓 CS Major @ IIT Madras | 💻 Full-Stack & Algorithm Mentor | 🚀 15 Doubts Solved | 📩 DM for 1:1 WebRTC peer sessions',
        skills: ['Java', 'Algorithms', 'React', 'Data Structures'],
        teachingSkills: ['Java', 'Data Structures', 'Calculus', 'WebRTC'],
        learningGoals: ['System Design', 'AI/ML'],
        xp: 650,
        level: 4,
        coins: 45,
        reputation: 4.9,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav'
      },
      doubtsSolved: 15,
      endorsementsReceived: 28,
      campusRank: 1,
      badges: [
        { id: 'b1', name: 'First Doubt Solved', description: 'Awarded for resolving your 1st academic doubt room.' },
        { id: 'b2', name: '10 Sessions Taught', description: 'Taught over 10 live peer study sessions.' },
        { id: 'b3', name: 'Expert Mentor', description: 'Rated 4.8+ by campus peers across 10+ doubts.' },
        { id: 'b4', name: '7-Day Streak', description: 'Active on StudyLoop 7 days in a row.' }
      ],
      prevLevelXpThreshold: 500,
      nextLevelXpThreshold: 1000,
      xpProgressPercentage: 30
    };

    setData(mockData);
    setFullName(mockData.profile.fullName);
    setCollege(mockData.profile.college);
    setDepartment(mockData.profile.department);
    setYear(mockData.profile.year);
    setBio(mockData.profile.bio);
    setSkills(mockData.profile.skills.join(', '));
    setTeachingSkills(mockData.profile.teachingSkills.join(', '));
    setLearningGoals(mockData.profile.learningGoals.join(', '));
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/profiles/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          college,
          department,
          year: parseInt(year),
          bio,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
          teachingSkills: teachingSkills.split(',').map(s => s.trim()).filter(Boolean),
          learningGoals: learningGoals.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        updateProfileState(updatedProfile);
        setEditing(false);
        fetchDashboard();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update profile");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    }
  };

  const handlePublishContent = (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert("Please enter a title for your video or post!");
      return;
    }

    if (uploadType === 'reel') {
      const newReel = {
        id: `reel-${Date.now()}`,
        title: uploadTitle.trim(),
        duration: uploadDuration || '0:45',
        views: '1',
        likes: 1,
        hashtag: uploadSubject || '#Java',
        videoUrl: filePreviewUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        comments: []
      };
      setReelsList(prev => [newReel, ...prev]);
      setActiveProfileTab('reels');
      alert("✨ Short Reel published successfully to your Instagram profile!");
    } else if (uploadType === 'video') {
      const newVideo = {
        id: `vid-${Date.now()}`,
        title: uploadTitle.trim(),
        duration: uploadDuration || '15:20',
        views: '1',
        likes: 1,
        thumbnail: filePreviewUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        comments: []
      };
      setVideosList(prev => [newVideo, ...prev]);
      setActiveProfileTab('videos');
      alert("🎥 Long Lecture Video published successfully to your YouTube channel!");
    } else {
      const newPost = {
        id: `post-${Date.now()}`,
        title: uploadTitle.trim(),
        image: filePreviewUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
        likes: 1,
        comments: []
      };
      setPostsList(prev => [newPost, ...prev]);
      setActiveProfileTab('posts');
      alert("🖼️ Study Post published successfully!");
    }

    setIsUploading(false);
    setUploadTitle('');
    setUploadDuration('0:45');
    setFilePreviewUrl('');
  };

  const claimStreakBonus = async () => {
    try {
      const response = await fetch('/api/gamification/streak/claim', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Daily Streak Bonus claimed! +2 XP & +1 Coin added to your wallet.");
        fetchDashboard();
      }
    } catch (e) {
      alert("Streak claimed! +2 XP & +1 Peer Coin added.");
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedMedia) return;
    const newComment = { author: fullName || 'You', text: commentText.trim() };
    setSelectedMedia(prev => ({
      ...prev,
      comments: [...(prev.comments || []), newComment]
    }));
    setCommentText('');
  };

  const handleLikeMedia = () => {
    if (!selectedMedia) return;
    setSelectedMedia(prev => ({
      ...prev,
      likes: prev.likes + 1
    }));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="live-dot" style={{ backgroundColor: '#d97706' }}></div></div>;
  }

  const { profile, doubtsSolved, endorsementsReceived, campusRank, badges, xpProgressPercentage } = data;
  const usernameHandle = `@${(profile.fullName || 'student').toLowerCase().replace(/\s+/g, '_')}`;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* INSTAGRAM PROFILE HEADER & BIO */}
      <div className="card-premium glass-card" style={{ padding: '2rem', borderRadius: '24px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* INSTAGRAM GRADIENT STORY AVATAR RING */}
          <div style={{
            width: '108px',
            height: '108px',
            borderRadius: '50%',
            padding: '4px',
            background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(220, 39, 67, 0.25)'
          }}>
            <img src={profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.fullName}`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid #ffffff', objectFit: 'cover' }} />
          </div>

          {/* PROFILE INFO & COUNTERS */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* USERNAME HANDLE & VERIFIED BADGE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{usernameHandle}</h2>
              <span className="tag tag-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <CheckCircle size={14} /> Verified Student Mentor
              </span>
              
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                <button onClick={() => setIsUploading(true)} className="btn btn-primary glow-amber" style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <PlusCircle size={15} /> + Upload Media
                </button>
                <button onClick={claimStreakBonus} className="btn btn-accent" style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem' }}>
                  <Flame size={14} fill="#ffffff" /> Streak (+2 XP)
                </button>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem' }}>
                    Edit Bio
                  </button>
                )}
              </div>
            </div>

            {/* INSTAGRAM COUNTERS STRIP */}
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9375rem', color: '#0f172a' }}>
              <div><strong>{postsList.length}</strong> <span style={{ color: '#64748b' }}>posts</span></div>
              <div><strong>{reelsList.length}</strong> <span style={{ color: '#64748b' }}>reels</span></div>
              <div><strong>{videosList.length}</strong> <span style={{ color: '#64748b' }}>videos</span></div>
              <div><strong>240</strong> <span style={{ color: '#64748b' }}>followers</span></div>
              <div><strong>180</strong> <span style={{ color: '#64748b' }}>following</span></div>
              <div style={{ color: '#d97706', fontWeight: 700 }}>⚡ {profile.xp} XP • Lvl {profile.level}</div>
            </div>

            {/* BIO & COLLEGE DETAILS */}
            <div style={{ fontSize: '0.9375rem', lineHeight: 1.5, color: '#334155' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                {profile.fullName} ({profile.college || 'IIT Madras'} • {profile.department || 'CS'})
              </div>
              <p style={{ whiteSpace: 'pre-line', marginBottom: '0.75rem' }}>{profile.bio || "🎓 Computer Science Major | 💻 Full-Stack & Algorithm Mentor | 🚀 15 Doubts Resolved | ✉️ DM for 1:1 WebRTC peer sessions"}</p>
              
              {/* TEACHING SKILLS PILLS */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {(profile.teachingSkills || ['Java', 'Algorithms', 'React', 'Calculus']).map((skill, idx) => (
                  <span key={idx} className="tag tag-secondary" style={{ fontSize: '0.6875rem' }}>
                    ⭐ {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* XP LEVEL PROGRESS BAR */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
            <span>Campus Rank: <strong>#{campusRank || 1}</strong></span>
            <span>🪙 {profile.coins || 45} Peer Coins Balance</span>
            <span>Level {profile.level} ({xpProgressPercentage}% to Lvl {profile.level + 1})</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '50px', overflow: 'hidden' }}>
            <div style={{ width: `${xpProgressPercentage}%`, height: '100%', backgroundColor: '#d97706', borderRadius: '50px' }}></div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL / FORM */}
      {editing && (
        <form onSubmit={handleUpdateProfile} className="card-premium glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
          <h3 className="font-serif" style={{ fontSize: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Edit Bio & Teaching Skills</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="label">College</label>
              <input type="text" className="input" value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. IIT Madras" required />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell peers what you teach best..." />
          </div>
          <div>
            <label className="label">Teaching Skills (comma separated)</label>
            <input type="text" className="input" value={teachingSkills} onChange={e => setTeachingSkills(e.target.value)} placeholder="Java, Algorithms, Calculus" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-accent">Save Changes</button>
            <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* INSTAGRAM TAB SWITCHER NAVBAR */}
      <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveProfileTab('posts')}
          style={{
            padding: '0.875rem 2rem',
            border: 'none',
            borderBottom: activeProfileTab === 'posts' ? '2px solid #0f172a' : '2px solid transparent',
            background: 'transparent',
            fontWeight: activeProfileTab === 'posts' ? 700 : 500,
            color: activeProfileTab === 'posts' ? '#0f172a' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <BookOpen size={18} /> POSTS ({postsList.length})
        </button>

        <button 
          onClick={() => setActiveProfileTab('reels')}
          style={{
            padding: '0.875rem 2rem',
            border: 'none',
            borderBottom: activeProfileTab === 'reels' ? '2px solid #0f172a' : '2px solid transparent',
            background: 'transparent',
            fontWeight: activeProfileTab === 'reels' ? 700 : 500,
            color: activeProfileTab === 'reels' ? '#0f172a' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <Tv2 size={18} /> REELS ({reelsList.length})
        </button>

        <button 
          onClick={() => setActiveProfileTab('videos')}
          style={{
            padding: '0.875rem 2rem',
            border: 'none',
            borderBottom: activeProfileTab === 'videos' ? '2px solid #0f172a' : '2px solid transparent',
            background: 'transparent',
            fontWeight: activeProfileTab === 'videos' ? 700 : 500,
            color: activeProfileTab === 'videos' ? '#0f172a' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <Sparkles size={18} /> LONG VIDEOS ({videosList.length})
        </button>

        <button 
          onClick={() => setActiveProfileTab('badges')}
          style={{
            padding: '0.875rem 2rem',
            border: 'none',
            borderBottom: activeProfileTab === 'badges' ? '2px solid #0f172a' : '2px solid transparent',
            background: 'transparent',
            fontWeight: activeProfileTab === 'badges' ? 700 : 500,
            color: activeProfileTab === 'badges' ? '#0f172a' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <Award size={18} /> BADGES ({badges.length})
        </button>
      </div>

      {/* TAB CONTENT 1: POSTS GRID */}
      {activeProfileTab === 'posts' && (
        <div className="grid-3">
          {postsList.map(post => (
            <div 
              key={post.id} 
              onClick={() => setSelectedMedia({ ...post, type: 'post' })}
              className="card-premium" 
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
            >
              <img src={post.image} alt="Post" style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {post.title}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc2743', fontWeight: 600 }}>
                    ❤️ {post.likes} likes
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    💬 {post.comments.length} comments
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT 2: REELS GRID */}
      {activeProfileTab === 'reels' && (
        <div className="grid-3">
          {reelsList.map(reel => (
            <div 
              key={reel.id} 
              onClick={() => setSelectedMedia({ ...reel, type: 'reel' })}
              className="card-premium" 
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', height: '280px', backgroundColor: '#0f172a', position: 'relative', borderRadius: '16px' }}
            >
              <video src={reel.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.6875rem' }}>
                ⚡ {reel.duration}
              </div>
              <div style={{ position: 'absolute', bottom: '0', inset: 'auto 0 0 0', padding: '1rem', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', color: '#ffffff' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>{reel.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.9 }}>
                  <span>▶ {reel.views} views</span>
                  <span style={{ color: '#f43f5e', fontWeight: 600 }}>❤️ {reel.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT 3: LONG VIDEOS GRID */}
      {activeProfileTab === 'videos' && (
        <div className="grid-2">
          {videosList.map(vid => (
            <div 
              key={vid.id} 
              onClick={() => setSelectedMedia({ ...vid, type: 'video' })}
              className="card-premium" 
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
            >
              <div style={{ position: 'relative' }}>
                <img src={vid.thumbnail} alt="Video" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  🎥 {vid.duration}
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>{vid.title}</div>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>▶ {vid.views} views</span>
                  <span style={{ color: '#dc2743', fontWeight: 600 }}>❤️ {vid.likes} likes</span>
                  <span>💬 {vid.comments.length} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT 4: BADGES & ACCOMPLISHMENTS */}
      {activeProfileTab === 'badges' && (
        <div className="card-premium">
          <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={24} style={{ color: '#d97706' }} /> Awarded Campus Badges & Medals
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {badges.map(badge => (
              <div key={badge.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#fffbeb', border: '2px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.25rem', marginBottom: '0.5rem', boxShadow: '0 8px 16px rgba(217, 119, 6, 0.15)' }}>
                  🏅
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{badge.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.3 }}>{badge.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSTAGRAM MEDIA INSPECTOR MODAL */}
      {selectedMedia && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card-premium glass-card" style={{ width: '100%', maxWidth: '600px', padding: '1.5rem', borderRadius: '20px', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
            
            <button 
              onClick={() => setSelectedMedia(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img src={profile.avatarUrl} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{usernameHandle}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{profile.college}</div>
              </div>
            </div>

            {selectedMedia.image && <img src={selectedMedia.image} alt="Media" style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', maxHeight: '300px', objectFit: 'cover' }} />}
            {selectedMedia.thumbnail && <img src={selectedMedia.thumbnail} alt="Thumbnail" style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', maxHeight: '300px', objectFit: 'cover' }} />}
            {selectedMedia.videoUrl && <video src={selectedMedia.videoUrl} controls style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', maxHeight: '300px', backgroundColor: '#000000' }} />}

            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>{selectedMedia.title}</h3>

            {/* ACTION BAR: LIKE, COMMENT, SHARE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.75rem 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <button onClick={handleLikeMedia} className="btn btn-secondary" style={{ color: '#dc2743', borderColor: '#fecdd3' }}>
                ❤️ Like ({selectedMedia.likes})
              </button>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>💬 {selectedMedia.comments ? selectedMedia.comments.length : 0} Comments</span>
            </div>

            {/* COMMENTS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Comments</h4>
              {(!selectedMedia.comments || selectedMedia.comments.length === 0) ? (
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>No comments yet. Be the first to comment!</div>
              ) : (
                selectedMedia.comments.map((c, i) => (
                  <div key={i} style={{ fontSize: '0.8125rem', backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                    <strong>{c.author}:</strong> {c.text}
                  </div>
                ))
              )}
            </div>

            {/* COMMENT INPUT FORM */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Add a comment..." 
                value={commentText} 
                onChange={e => setCommentText(e.target.value)} 
                style={{ flex: 1, fontSize: '0.8125rem' }} 
              />
              <button type="submit" className="btn btn-accent" style={{ fontSize: '0.8125rem' }}>Post</button>
            </form>

          </div>
        </div>
      )}

      {/* MEDIA CREATOR STUDIO UPLOAD MODAL (INSTAGRAM + YOUTUBE REFERENCE) */}
      {isUploading && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card-premium glass-card" style={{ width: '100%', maxWidth: '640px', padding: '2rem', borderRadius: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <button 
              onClick={() => setIsUploading(false)} 
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlusCircle size={24} />
              </div>
              <div>
                <h3 className="font-serif" style={{ fontSize: '1.5rem', margin: 0 }}>Create & Upload Media</h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>Publish Short Reels (Instagram) or Full Lectures (YouTube) to your student profile</p>
              </div>
            </div>

            <form onSubmit={handlePublishContent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* CONTENT TYPE SELECTOR PILLS */}
              <div>
                <label className="label">Select Content Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => { setUploadType('reel'); setUploadDuration('0:45'); }}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: uploadType === 'reel' ? '2px solid #d97706' : '1px solid #e2e8f0',
                      backgroundColor: uploadType === 'reel' ? '#fffbeb' : '#ffffff',
                      color: uploadType === 'reel' ? '#b45309' : '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8125rem'
                    }}
                  >
                    📱 Short Reel (9:16)
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUploadType('video'); setUploadDuration('15:20'); }}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: uploadType === 'video' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      backgroundColor: uploadType === 'video' ? '#f0f9ff' : '#ffffff',
                      color: uploadType === 'video' ? '#0369a1' : '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8125rem'
                    }}
                  >
                    🎥 Long Lecture (16:9)
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadType('post')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: uploadType === 'post' ? '2px solid #059669' : '1px solid #e2e8f0',
                      backgroundColor: uploadType === 'post' ? '#ecfdf5' : '#ffffff',
                      color: uploadType === 'post' ? '#047857' : '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8125rem'
                    }}
                  >
                    🖼️ Study Notes / Post
                  </button>
                </div>
              </div>

              {/* TITLE INPUT */}
              <div>
                <label className="label">Title / Headline</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder={uploadType === 'reel' ? "e.g. 3 Tricks to solve Recursion fast ⚡" : uploadType === 'video' ? "e.g. Operating Systems: Deadlock Prevention Masterclass" : "e.g. Java Collections Cheat Sheet 📊"} 
                  value={uploadTitle} 
                  onChange={e => setUploadTitle(e.target.value)} 
                  required 
                />
              </div>

              {/* SUBJECT TAG & DURATION */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Subject Tag</label>
                  <select className="input" value={uploadSubject} onChange={e => setUploadSubject(e.target.value)}>
                    <option value="#Java">#Java</option>
                    <option value="#Algorithms">#Algorithms</option>
                    <option value="#React">#React</option>
                    <option value="#Calculus">#Calculus</option>
                    <option value="#WebRTC">#WebRTC</option>
                    <option value="#SystemDesign">#SystemDesign</option>
                  </select>
                </div>

                <div>
                  <label className="label">Estimated Duration</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. 0:45 or 15:30" 
                    value={uploadDuration} 
                    onChange={e => setUploadDuration(e.target.value)} 
                  />
                </div>
              </div>

              {/* FILE PICKER WITH LIVE PREVIEW */}
              <div>
                <label className="label">Upload Media File (Video / Image)</label>
                <input 
                  type="file" 
                  accept="video/*,image/*" 
                  onChange={handleFileSelect} 
                  className="input" 
                  style={{ padding: '0.5rem' }} 
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Supported formats: .mp4, .mov, .jpg, .png (Max 100MB). Sample preview assigned if omitted.
                </div>
              </div>

              {/* LIVE PREVIEW BOX */}
              {filePreviewUrl && (
                <div style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '0.75rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Live File Preview</div>
                  {uploadType === 'reel' ? (
                    <video src={filePreviewUrl} controls style={{ maxHeight: '180px', borderRadius: '8px' }} />
                  ) : (
                    <img src={filePreviewUrl} alt="Preview" style={{ maxHeight: '180px', borderRadius: '8px', objectFit: 'cover' }} />
                  )}
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-accent glow-amber" style={{ flex: 1, padding: '0.75rem' }}>
                  🚀 Publish to Profile & Feed
                </button>
                <button type="button" onClick={() => setIsUploading(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

// --- SCREEN: DISCOVER PEERS & ALGORITHMS (3.1) ---
function DiscoverScreen({ token, setActiveTab, setActiveChatId, setChatPeer }) {
  const [candidates, setCandidates] = useState([]);
  const [mode, setMode] = useState('match'); // 'match', 'mentors', 'skill-swap'
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async (currentMode) => {
    setLoading(true);
    let url = '/api/discovery';
    if (currentMode === 'mentors') {
      url = '/api/discovery/mentors';
    } else if (currentMode === 'skill-swap') {
      url = '/api/discovery/skill-swap';
    }

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCandidates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(mode);
  }, [mode, token]);

  const sendRequest = async (peerId) => {
    try {
      const response = await fetch(`/api/connections/request?receiverId=${peerId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Connection request sent!");
      } else {
        const txt = await response.text();
        alert(txt || "Failed to send request");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const endorseSkill = async (peerId, skill) => {
    try {
      const response = await fetch(`/api/gamification/endorse?recipientId=${peerId}&skill=${encodeURIComponent(skill)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert(`Successfully endorsed skill "${skill}"! +10 XP & +5 Coins awarded to peer.`);
      } else {
        const txt = await response.text();
        alert(txt || "Endorsement failed.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startDirectMessage = async (peer) => {
    try {
      const response = await fetch(`/api/chats/direct/init?peerId=${peer.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const chat = await response.json();
        setActiveChatId(chat.id);
        setChatPeer(peer);
        setActiveTab('chat');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.25rem' }}>Discover Peers</h1>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>Instantly discover study partners and campus mentors mapped to your goals.</p>
        </div>

        {/* Tab switches */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
          <button onClick={() => setMode('match')} className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', background: mode === 'match' ? '#ffffff' : 'transparent', color: mode === 'match' ? '#0f172a' : '#475569', border: 'none', boxShadow: mode === 'match' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}>
            Smart Match
          </button>
          <button onClick={() => setMode('mentors')} className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', background: mode === 'mentors' ? '#ffffff' : 'transparent', color: mode === 'mentors' ? '#0f172a' : '#475569', border: 'none', boxShadow: mode === 'mentors' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}>
            Seniors
          </button>
          <button onClick={() => setMode('skill-swap')} className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', background: mode === 'skill-swap' ? '#ffffff' : 'transparent', color: mode === 'skill-swap' ? '#0f172a' : '#475569', border: 'none', boxShadow: mode === 'skill-swap' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}>
            Skill Swap
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="live-dot" style={{ backgroundColor: '#d97706' }}></div></div>
      ) : candidates.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No students found</h3>
          <p>Please ensure you have filled out your profile settings (skills and learning goals) to receive matched results.</p>
        </div>
      ) : (
        <div className="grid-2">
          {candidates.map(candidate => (
            <div key={candidate.profile.id} className="card-premium" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Score label */}
              <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontSize: '0.6875rem', fontWeight: 600, color: '#d97706', backgroundColor: '#fef3c7', padding: '0.25rem 0.625rem', borderRadius: '50px' }}>
                Match: {candidate.score} pts
              </div>

              {/* Header profile details */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <img src={candidate.profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${candidate.profile.fullName}`} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                <div>
                  <h3 className="font-serif" style={{ fontSize: '1.25rem' }}>{candidate.profile.fullName}</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                    {candidate.profile.college} • {candidate.profile.department} • Year {candidate.profile.year}
                  </div>
                </div>
              </div>

              <p style={{ color: '#475569', fontSize: '0.8125rem', marginBottom: '1.25rem', flex: 1 }}>
                {candidate.profile.bio || "No bio added yet."}
              </p>

              {/* Skills listings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {candidate.profile.teachingSkills?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8' }}>Can Help:</span>
                    {candidate.profile.teachingSkills.map(s => (
                      <span key={s} className="tag tag-accent" style={{ fontSize: '0.6875rem' }}>{s}</span>
                    ))}
                  </div>
                )}
                {candidate.profile.learningGoals?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8' }}>Wants:</span>
                    {candidate.profile.learningGoals.map(s => (
                      <span key={s} className="tag" style={{ fontSize: '0.6875rem' }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action triggers */}
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button onClick={() => sendRequest(candidate.profile.id)} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem 0.25rem', fontSize: '0.75rem' }}>
                  Connect
                </button>
                <button onClick={() => endorseSkill(candidate.profile.id, candidate.profile.teachingSkills?.[0] || 'Peer Learning')} className="btn btn-accent" style={{ flex: 1, padding: '0.5rem 0.25rem', fontSize: '0.75rem' }}>
                  ⭐ Endorse
                </button>
                <button onClick={() => startDirectMessage(candidate.profile.id)} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem 0.25rem', fontSize: '0.75rem' }}>
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- SCREEN: MY CONNECTIONS (ACCEPTED & INCOMING PENDING) ---
function ConnectionsScreen({ token, setActiveTab, setActiveChatId, setChatPeer }) {
  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      // 1. Fetch active
      const responseActive = await fetch('/api/connections/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (responseActive.ok) {
        const data = await responseActive.json();
        setConnections(data);
      }

      // 2. Fetch pending
      const responsePending = await fetch('/api/connections/requests/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (responsePending.ok) {
        const data = await responsePending.json();
        setPending(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [token]);

  const acceptRequest = async (connId) => {
    try {
      const response = await fetch(`/api/connections/${connId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchConnections();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const rejectRequest = async (connId) => {
    try {
      const response = await fetch(`/api/connections/${connId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchConnections();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startChat = async (peer) => {
    try {
      const response = await fetch(`/api/chats/direct/init?peerId=${peer.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const chat = await response.json();
        setActiveChatId(chat.id);
        setChatPeer(peer);
        setActiveTab('chat');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="live-dot" style={{ backgroundColor: '#d97706' }}></div></div>;
  }

  return (
    <div>
      <h1 className="font-serif" style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>My Connections</h1>
      <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '2rem' }}>Manage your active college network connections and incoming requests.</p>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#b45309' }}>Pending Invitations ({pending.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pending.map(req => (
              <div key={req.connectionId} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={req.profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${req.profile.fullName}`} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.profile.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.profile.college} • Year {req.profile.year}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => acceptRequest(req.connectionId)} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}><Check size={14} /> Accept</button>
                  <button onClick={() => rejectRequest(req.connectionId)} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}><X size={14} /> Ignore</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active connections */}
      <h2 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Active Network</h2>
      {connections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No active connections yet. Discover peers to grow your circle!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {connections.map(conn => (
            <div key={conn.connectionId} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={conn.profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${conn.profile.fullName}`} alt="Avatar" style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{conn.profile.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{conn.profile.college} • {conn.profile.department}</div>
                </div>
              </div>
              <button onClick={() => startChat(conn.profile)} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                <MessageSquare size={14} /> Chat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- SCREEN: DOUBT ROOMS & LIVE WebSocket GROUP CHAT ---
function DoubtRoomsScreen({ token, activeRoomId, setActiveRoomId, socket, wsMessages, setWsMessages, startWebRtcCall, webrtcCall }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [textMsg, setTextMsg] = useState('');
  const [roomData, setRoomData] = useState(null); // active room model details

  const chatBottomRef = useRef(null);
  const { profile } = useAuth();

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/doubts/live', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeRoomId) {
      fetchRooms();
    } else {
      fetchRoomDetails(activeRoomId);
      // Join WebSocket room (Section 6)
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'JOIN_ROOM',
          roomId: activeRoomId
        }));
      }
      // Load room message history
      fetchRoomChatHistory(activeRoomId);
    }

    return () => {
      if (activeRoomId && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'LEAVE_ROOM',
          roomId: activeRoomId
        }));
      }
    };
  }, [activeRoomId, socket]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [wsMessages]);

  const fetchRoomDetails = async (roomId) => {
    try {
      const response = await fetch(`/api/doubts/live`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const list = await response.json();
        const found = list.find(r => r.id === roomId);
        if (found) setRoomData(found);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRoomChatHistory = async (roomId) => {
    try {
      const response = await fetch(`/api/chats/doubt/${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const history = await response.json();
        // Convert schema database shape to local WS template
        const formatted = history.map(h => ({
          type: 'ROOM_MSG',
          roomId: h.roomId,
          senderId: h.senderId,
          message: h.message,
          createdAt: h.createdAt
        }));
        setWsMessages(formatted);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!title || !subject) return;

    try {
      const response = await fetch('/api/doubts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, subject })
      });

      if (response.ok) {
        const newRoom = await response.json();
        setTitle('');
        setDescription('');
        setSubject('');
        setShowCreate(false);
        setActiveRoomId(newRoom.id);
      } else {
        const txt = await response.text();
        alert(txt || "Failed to create doubt room");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const joinAsHelper = async (roomId) => {
    try {
      const response = await fetch(`/api/doubts/${roomId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const updated = await response.json();
        setRoomData(updated);
        setActiveRoomId(roomId);
      } else {
        const txt = await response.text();
        alert(txt || "Failed to join");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendRoomMessage = (e) => {
    e.preventDefault();
    if (!textMsg.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: 'CHAT_MSG',
      roomId: activeRoomId,
      message: textMsg
    }));
    setTextMsg('');
  };

  const markSolved = async () => {
    try {
      const response = await fetch(`/api/doubts/${activeRoomId}/solve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Doubt resolved! Helper rewarded +10 XP.");
        setActiveRoomId(null);
        setRoomData(null);
      } else {
        alert("Failed to solve room");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (activeRoomId) {
    // --- LIVE ROOM WORKSPACE & CHAT ---
    const isCreator = roomData && roomData.creatorId === profile.id;
    const isHelper = roomData && roomData.helperId === profile.id;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="live-indicator"><span className="live-dot"></span> Live workspace</span>
              <span className="tag tag-accent">{roomData?.subject}</span>
            </div>
            <h2 className="font-serif" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{roomData?.title}</h2>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Call button options */}
            {!webrtcCall && (
              <button 
                onClick={() => startWebRtcCall(isCreator ? roomData.helperId : roomData.creatorId, activeRoomId)} 
                className="btn btn-accent" 
                disabled={!roomData?.helperId}
                style={{ opacity: roomData?.helperId ? 1 : 0.6 }}
              >
                <Video size={16} /> Start Video Call
              </button>
            )}

            {isCreator && (
              <button onClick={markSolved} className="btn btn-primary">
                Mark Resolved
              </button>
            )}

            <button onClick={() => { setActiveRoomId(null); setRoomData(null); }} className="btn btn-secondary">
              Exit Room
            </button>
          </div>
        </div>

        {/* Workspace body */}
        <div style={{ display: 'flex', flex: 1, gap: '1.5rem', overflow: 'hidden' }}>
          {/* Left panel: Info & Helper status */}
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Description</h4>
              <p style={{ fontSize: '0.8125rem', color: '#475569' }}>{roomData?.description || "No description provided."}</p>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem' }}>Workspace Helper</h4>
              {roomData?.helperId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="live-dot" style={{ backgroundColor: '#059669', width: '8px', height: '8px' }}></div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Peer helper connected</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                  <div className="live-dot" style={{ backgroundColor: '#cbd5e1', width: '8px', height: '8px' }}></div>
                  <span style={{ fontSize: '0.8125rem' }}>Waiting for a helper...</span>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Chat messages */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', paddingRight: '0.25rem' }}>
              {wsMessages.filter(m => m.roomId === activeRoomId || m.type === 'ROOM_MSG').map((msg, i) => {
                const isMe = msg.senderId === profile.id;
                return (
                  <div key={i} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    backgroundColor: isMe ? '#fef3c7' : '#f1f5f9',
                    color: '#0f172a',
                    padding: '0.75rem 1rem',
                    borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    border: '1px solid',
                    borderColor: isMe ? '#fde68a' : '#e2e8f0'
                  }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', marginBottom: '0.125rem', fontWeight: 600 }}>
                      {isMe ? "You" : msg.senderName || "Peer"}
                    </span>
                    <span style={{ fontSize: '0.875rem' }}>{msg.message}</span>
                  </div>
                );
              })}
              <div ref={chatBottomRef}></div>
            </div>

            <form onSubmit={sendRoomMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Type your message here..." 
                value={textMsg} 
                onChange={e => setTextMsg(e.target.value)} 
                required 
              />
              <button type="submit" className="btn btn-accent"><Send size={16} /></button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- DOUBTS DASHBOARD LISTING ---
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.25rem' }}>Live Doubt Rooms</h1>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>Join workspace rooms on your campus or start a new help query.</p>
        </div>

        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-accent">
          {showCreate ? "Close Panel" : "Ask a Doubt"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateRoom} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem', maxWidth: '640px' }}>
          <h3 className="font-serif" style={{ fontSize: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Request Peer Help</h3>
          
          <div>
            <label className="label">Doubt Title / What is confusing you?</label>
            <input type="text" className="input" placeholder="e.g. Help balancing redox chemical equations" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Subject Category</label>
              <input type="text" className="input" placeholder="e.g. Chemistry, Calculus, OS" value={subject} onChange={e => setSubject(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="label">Explanation details (context, question source, etc.)</label>
            <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Provide error message or textbook question context..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-accent" style={{ alignSelf: 'flex-start' }}><Plus size={16} /> Open Doubt Room</button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="live-dot" style={{ backgroundColor: '#d97706' }}></div></div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <HelpCircle size={48} />
          <h3>No doubts open</h3>
          <p>Everything is quiet on campus! Enjoy your study loop or raise a question of your own.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rooms.map(room => (
            <div key={room.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="live-indicator"><span className="live-dot"></span> Live room</span>
                  <span className="tag tag-accent">{room.subject}</span>
                </div>
                <h3 className="font-serif" style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{room.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>College: {room.college} • Started {new Date(room.createdAt).toLocaleTimeString()}</p>
              </div>

              <div>
                <button onClick={() => joinAsHelper(room.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                  Join as Helper
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- SCREEN: DIRECT CHAT 1:1 MESSAGING ---
function ChatScreen({ token, activeChatId, setActiveChatId, chatPeer, setChatPeer, socket, wsMessages, setWsMessages }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const chatBottomRef = useRef(null);

  const { profile } = useAuth();

  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/chats/direct/threads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (chatId) => {
    try {
      const response = await fetch(`/api/chats/direct/${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const formatted = data.map(m => ({
          type: 'DIRECT_MSG',
          chatId: m.chatId,
          senderId: m.senderId,
          message: m.message,
          createdAt: m.createdAt
        }));
        setWsMessages(formatted);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [token]);

  useEffect(() => {
    if (activeChatId) {
      fetchChatHistory(activeChatId);
    }
  }, [activeChatId]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [wsMessages]);

  const sendDirectMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: 'DIRECT_MSG',
      chatId: activeChatId,
      message: text
    }));
    setText('');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="live-dot" style={{ backgroundColor: '#d97706' }}></div></div>;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '1.5rem' }}>
      {/* Threads list */}
      <div className="card" style={{ width: '280px', display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto' }}>
        <h3 className="font-serif" style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Chats</h3>
        {threads.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', margin: '2rem 0' }}>No chats active.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {threads.map(t => (
              <button key={t.chatId} onClick={() => { setActiveChatId(t.chatId); setChatPeer(t.peer); }} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeChatId === t.chatId ? '#fef3c7' : 'transparent',
                textAlign: 'left'
              }}>
                <img src={t.peer.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${t.peer.fullName}`} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.peer.fullName}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.peer.college}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat pane */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
        {activeChatId ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <img src={chatPeer?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${chatPeer?.fullName}`} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>{chatPeer?.fullName}</h4>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{chatPeer?.college}</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {wsMessages.filter(m => m.chatId === activeChatId).map((msg, i) => {
                const isMe = msg.senderId === profile.id;
                return (
                  <div key={i} style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    backgroundColor: isMe ? '#fef3c7' : '#f1f5f9',
                    color: '#0f172a',
                    padding: '0.625rem 1rem',
                    borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    border: '1px solid',
                    borderColor: isMe ? '#fde68a' : '#e2e8f0',
                    fontSize: '0.875rem'
                  }}>
                    {msg.message}
                  </div>
                );
              })}
              <div ref={chatBottomRef}></div>
            </div>

            <form onSubmit={sendDirectMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="input" placeholder="Type direct message..." value={text} onChange={e => setText(e.target.value)} required />
              <button type="submit" className="btn btn-accent"><Send size={16} /></button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
            <MessageSquare size={48} />
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Select a connection to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SCREEN: EDUCATIONAL REELS (INSTAGRAM REELS FORMAT) ---
function ReelsScreen({ token }) {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  
  // Interaction states
  const [likedMap, setLikedMap] = useState({});
  const [likesCountMap, setLikesCountMap] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentText, setCommentText] = useState('');
  const [followingMap, setFollowingMap] = useState({});

  // Upload form
  const [videoUrl, setVideoUrl] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const videoRef = useRef(null);

  const defaultReels = [
    {
      id: "reel-1",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      subject: "React",
      description: "React useEffect & State lifecycle visual breakdown in 60 seconds! 🚀 #ReactHooks #Frontend",
      likesCount: 342,
      commentsCount: 18,
      creator: {
        id: "studenta-uuid",
        fullName: "Aarav Sharma",
        username: "aarav_cs_iitm",
        college: "IIT Madras",
        department: "Computer Science",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
      }
    },
    {
      id: "reel-2",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      subject: "Java",
      description: "Java Multithreading & ReentrantLocks explained with real memory diagrams! ⚡ #JavaConcurrency #CS",
      likesCount: 512,
      commentsCount: 34,
      creator: {
        id: "studentb-uuid",
        fullName: "Bhavna Patel",
        username: "bhavna_code",
        college: "IIT Bombay",
        department: "Information Tech",
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
      }
    },
    {
      id: "reel-3",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      subject: "Data Structures",
      description: "Big-O Notation Memory Tricks! Master O(1) vs O(N log N) visually. 🧠 #Algorithms #CodingInterview",
      likesCount: 789,
      commentsCount: 42,
      creator: {
        id: "studentc-uuid",
        fullName: "Chaitanya Kumar",
        username: "chaitanya_dev",
        college: "BITS Pilani",
        department: "Electrical Eng",
        avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
      }
    }
  ];

  const fetchReels = async () => {
    try {
      const response = await fetch('/api/reels', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setReels(data);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    setReels(defaultReels);
    const initialLikes = {};
    defaultReels.forEach(r => { initialLikes[r.id] = r.likesCount; });
    setLikesCountMap(initialLikes);
    setLoading(false);
  };

  useEffect(() => {
    fetchReels();
  }, [token]);

  const activeReel = reels[currentIndex] || defaultReels[0];

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleLike = (reelId) => {
    const isLiked = likedMap[reelId];
    const currentCount = likesCountMap[reelId] || activeReel.likesCount;
    setLikedMap(prev => ({ ...prev, [reelId]: !isLiked }));
    setLikesCountMap(prev => ({ ...prev, [reelId]: isLiked ? currentCount - 1 : currentCount + 1 }));

    fetch(`/api/reels/${reelId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(e => console.error(e));
  };

  const toggleFollow = (creatorId) => {
    setFollowingMap(prev => ({ ...prev, [creatorId]: !prev[creatorId] }));
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      senderName: "You",
      comment: commentText,
      createdAt: new Date().toISOString()
    };

    const currentList = commentsMap[activeReel.id] || [];
    setCommentsMap(prev => ({
      ...prev,
      [activeReel.id]: [...currentList, newComment]
    }));
    setCommentText('');

    fetch(`/api/reels/${activeReel.id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ comment: commentText })
    }).catch(e => console.error(e));
  };

  const handleUploadReel = async (e) => {
    e.preventDefault();
    if (!videoUrl || !subject) return;

    const newReel = {
      id: "user-reel-" + Date.now(),
      videoUrl: videoUrl,
      subject: subject,
      description: description || "Educational short lesson",
      likesCount: 1,
      commentsCount: 0,
      creator: {
        id: "me",
        fullName: "You",
        username: "studyloop_creator",
        college: "My Campus",
        department: "StudyLoop",
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=You`
      }
    };

    setReels([newReel, ...reels]);
    setCurrentIndex(0);
    setVideoUrl('');
    setSubject('');
    setDescription('');
    setShowUpload(false);

    try {
      await fetch('/api/reels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ videoUrl, subject, description })
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="live-dot" style={{ backgroundColor: '#d97706' }}></div></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', padding: '0.5rem 0' }}>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '420px', marginBottom: '1rem' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tv2 size={24} style={{ color: '#d97706' }} /> Study Reels
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Instagram-style educational shorts</p>
        </div>

        <button onClick={() => setShowUpload(!showUpload)} className="btn btn-accent" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
          <Plus size={16} /> Post Reel
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <form onSubmit={handleUploadReel} className="card-premium" style={{ width: '100%', maxWidth: '420px', marginBottom: '1rem', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="font-serif" style={{ fontSize: '1.125rem' }}>Upload Concept Short</h3>
            <button type="button" onClick={() => setShowUpload(false)} className="btn-icon"><X size={16} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label className="label">Video Stream URL (MP4)</label>
              <input type="text" className="input" placeholder="https://.../video.mp4" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} required />
            </div>
            <div>
              <label className="label">Subject Tag</label>
              <input type="text" className="input" placeholder="e.g. React, Java, Calculus" value={subject} onChange={e => setSubject(e.target.value)} required />
            </div>
            <div>
              <label className="label">Caption & Concept Explanation</label>
              <textarea className="input" style={{ minHeight: '60px' }} placeholder="Explain this academic concept in 60s..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>Publish to Reels</button>
          </div>
        </form>
      )}

      {/* INSTAGRAM REELS PHONE CONTAINER */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        height: '640px',
        backgroundColor: '#09090b',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Video Player */}
        <video
          ref={videoRef}
          src={activeReel.videoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
          autoPlay
          loop
          muted={muted}
          playsInline
          onClick={togglePlay}
        />

        {/* Up / Down Navigation Overlays */}
        <div style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={handlePrev} disabled={currentIndex === 0} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentIndex === 0 ? 0.3 : 1, cursor: 'pointer' }}>
              <ChevronUp size={18} />
            </button>
            <button onClick={handleNext} disabled={currentIndex === reels.length - 1} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentIndex === reels.length - 1 ? 0.3 : 1, cursor: 'pointer' }}>
              <ChevronDown size={18} />
            </button>
          </div>

          <button onClick={() => setMuted(!muted)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        {/* Play/Pause indicator overlay */}
        {!isPlaying && (
          <div onClick={togglePlay} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', cursor: 'pointer', zIndex: 5 }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              ▶
            </div>
          </div>
        )}

        {/* BOTTOM METADATA OVERLAY */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: '70px',
          padding: '1.25rem',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          zIndex: 10
        }}>
          {/* Creator handle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <img src={activeReel.creator?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${activeReel.creator?.fullName}`} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #d97706' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>@{activeReel.creator?.username || activeReel.creator?.fullName?.toLowerCase().replace(/\s+/g, '_')}</span>
                <button onClick={() => toggleFollow(activeReel.creator?.id)} style={{ background: 'transparent', border: '1px solid #ffffff', borderRadius: '4px', color: '#ffffff', fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.5rem', cursor: 'pointer' }}>
                  {followingMap[activeReel.creator?.id] ? "Following" : "Follow"}
                </button>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#cbd5e1' }}>
                {activeReel.creator?.college} • {activeReel.creator?.department}
              </div>
            </div>
          </div>

          {/* Caption & Subject Tag */}
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, backgroundColor: '#d97706', color: '#ffffff', padding: '0.125rem 0.5rem', borderRadius: '50px', marginRight: '0.5rem' }}>
              #{activeReel.subject}
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#f8fafc', lineHeight: 1.4 }}>
              {activeReel.description}
            </span>
          </div>

          {/* Music track ticker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: '#94a3b8' }}>
            <Music size={12} />
            <span>StudyLoop Academic Shorts • Original Audio</span>
          </div>
        </div>

        {/* RIGHT ACTION SIDEBAR */}
        <div style={{
          position: 'absolute',
          right: '0.75rem',
          bottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          alignItems: 'center',
          color: '#ffffff',
          zIndex: 10
        }}>
          {/* Like button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <button onClick={() => toggleLike(activeReel.id)} style={{ background: 'rgba(0,0,0,0.4)', border: 'none', width: '44px', height: '44px', borderRadius: '50%', color: likedMap[activeReel.id] ? '#ef4444' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
              <Heart size={22} fill={likedMap[activeReel.id] ? '#ef4444' : 'none'} />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              {likesCountMap[activeReel.id] || activeReel.likesCount}
            </span>
          </div>

          {/* Comment button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <button onClick={() => setShowComments(!showComments)} style={{ background: 'rgba(0,0,0,0.4)', border: 'none', width: '44px', height: '44px', borderRadius: '50%', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
              <MessageCircle size={22} />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              {(commentsMap[activeReel.id] || []).length || activeReel.commentsCount}
            </span>
          </div>

          {/* Share button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <button onClick={() => alert("Reel link copied to clipboard!")} style={{ background: 'rgba(0,0,0,0.4)', border: 'none', width: '44px', height: '44px', borderRadius: '50%', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
              <Share2 size={20} />
            </button>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Share</span>
          </div>

          {/* Spinning Audio Disc */}
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#18181b', border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Disc size={18} style={{ color: '#d97706' }} />
            </div>
          </div>
        </div>

        {/* INSTAGRAM COMMENTS SLIDE-UP DRAWER */}
        {showComments && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            backgroundColor: '#ffffff',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            color: '#0f172a',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 30,
            boxShadow: '0 -10px 25px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h4 className="font-serif" style={{ fontSize: '1rem', fontWeight: 700 }}>Comments</h4>
              <button onClick={() => setShowComments(false)} className="btn-icon" style={{ padding: '0.25rem' }}><X size={16} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {(commentsMap[activeReel.id] || []).length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: '2rem' }}>No comments yet. Start the conversation!</p>
              ) : (
                (commentsMap[activeReel.id] || []).map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8125rem' }}>
                    <strong>{c.senderName || 'Student'}:</strong>
                    <span style={{ color: '#334155' }}>{c.comment}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="input" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }} required />
              <button type="submit" className="btn btn-accent" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}><Send size={14} /></button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// --- COMPONENT: WebRTC LIVE CALL OVERLAY (SECTION 6) ---
function RtcCallOverlay({ localVideoRef, remoteVideoRef, isScreenSharing, toggleScreenShare, hangUpCall, webrtcCall, localStream, remoteStream }) {
  return (
    <div style={{
      position: 'fixed',
      top: '0',
      bottom: '0',
      left: '0',
      right: '0',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ color: '#ffffff', marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 className="font-serif" style={{ color: '#ffffff', fontSize: '2rem' }}>Live Study Session</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>Audio/Video WebRTC peer link established (₹0 Egress Fee traversal)</p>
      </div>

      {/* Video screen grid */}
      <div style={{ display: 'flex', gap: '1.5rem', width: '100%', maxWidth: '960px', height: '420px', marginBottom: '2rem' }}>
        {/* Remote participant */}
        <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '2px solid #334155' }}>
          <video 
            ref={remoteVideoRef} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            autoPlay 
            playsInline
          />
          {!remoteStream && (
            <div style={{ position: 'absolute', top: '0', bottom: '0', left: '0', right: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <div className="live-dot" style={{ backgroundColor: '#d97706', marginRight: '0.5rem' }}></div> Wait for peer user to accept call...
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.25rem 0.75rem', borderRadius: '50px', color: '#ffffff', fontSize: '0.75rem' }}>
            Peer Helper
          </div>
        </div>

        {/* Local user stream */}
        <div style={{ width: '220px', backgroundColor: '#1e293b', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '2px solid #334155', height: '160px', alignSelf: 'flex-end' }}>
          <video 
            ref={localVideoRef} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            autoPlay 
            muted 
            playsInline
          />
          <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.125rem 0.5rem', borderRadius: '50px', color: '#ffffff', fontSize: '0.6875rem' }}>
            You {isScreenSharing && "(Sharing)"}
          </div>
        </div>
      </div>

      {/* Control buttons tray */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={toggleScreenShare} className="btn btn-secondary" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
          <ScreenShare size={18} /> {isScreenSharing ? "Stop Sharing" : "Share Screen"}
        </button>
        <button onClick={hangUpCall} className="btn btn-danger">
          Hang Up Call
        </button>
      </div>
    </div>
  );
}

// --- SCREEN: CAMPUS LEADERBOARD ---
function LeaderboardScreen({ token }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    let url = '/api/leaderboard';
    if (subject) {
      url += `?subject=${encodeURIComponent(subject)}`;
    }
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeaders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [token, subject]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.25rem' }}>Campus Leaderboard</h1>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>Top peer mentors ranked by XP and subject mastery.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Category:</span>
          <select className="input" style={{ width: '160px', padding: '0.375rem 0.75rem' }} value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">All Subjects</option>
            <option value="Java">Java</option>
            <option value="React">React</option>
            <option value="WebRTC">WebRTC</option>
            <option value="Calculus">Calculus</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="live-dot" style={{ backgroundColor: '#d97706' }}></div></div>
      ) : leaders.length === 0 ? (
        <div className="empty-state">
          <Trophy size={48} />
          <h3>No rankings yet</h3>
          <p>Be the first to earn XP at your college to appear on the leaderboard!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {leaders.map((leader, index) => (
            <div key={leader.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', backgroundColor: index === 0 ? '#fffbeb' : '#ffffff', borderColor: index === 0 ? '#fde68a' : '#e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: index === 0 ? '#d97706' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#f1f5f9',
                  color: (index <= 2) ? '#ffffff' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {index + 1}
                </div>

                <img src={leader.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${leader.fullName}`} alt="Avatar" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />

                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {leader.fullName}
                    {index === 0 && <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>👑 Campus #1</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {leader.college} • {leader.department} • Level: <strong>{leader.level}</strong>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706' }}>{leader.xp} XP</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>⭐ {leader.reputation || 5.0} Rating</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FIRST PAGE / LANDING SCREEN ---
function LandingScreen({ setActiveTab, loginSimulated, testAccounts }) {
  const { user, profile, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf9', color: '#0f172a', padding: '0 1rem 4rem 1rem' }}>
      {/* LANDING NAVBAR WITH FAR RIGHT USER DETAILS */}
      <header style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 2.5rem',
        width: '100%',
        borderBottom: '1px solid #e7e5e4'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }} onClick={() => setActiveTab('landing')}>
          <div className="glow-amber" style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Infinity size={26} style={{ color: '#d97706' }} />
          </div>
          <span className="font-serif gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800 }}>StudyLoop</span>
        </div>

        {/* TOP FAR RIGHT CORNER STUDENT PROFILE / AVATAR LOGO DROPDOWN */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowDropdown(prev => !prev)}
                className="card-premium glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.4rem 1rem',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  border: '1px solid #e7e5e4'
                }}
              >
                <img 
                  src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.fullName || 'Aarav'}`} 
                  alt="Avatar" 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #d97706', objectFit: 'cover' }} 
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                    {profile?.fullName || 'Aarav Sharma'}
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: '#d97706', fontWeight: 600 }}>
                    ⚡ {profile?.xp || 650} XP • Lvl {profile?.level || 4}
                  </div>
                </div>
                <ChevronDown size={16} style={{ color: '#64748b', marginLeft: '0.25rem' }} />
              </button>

              {/* INTERACTIVE PROFILE DROPDOWN MENU */}
              {showDropdown && (
                <div className="card-premium glass-card" style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  width: '260px',
                  borderRadius: '16px',
                  padding: '0.75rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  zIndex: 2000,
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>{profile?.fullName || 'Aarav Sharma'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{profile?.college || 'IIT Madras'}</div>
                  </div>

                  <button 
                    onClick={() => { setShowDropdown(false); setActiveTab('dashboard'); }}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}
                  >
                    <Award size={16} style={{ color: '#d97706' }} /> Dashboard & Badges
                  </button>

                  <button 
                    onClick={() => { setShowDropdown(false); setActiveTab('dashboard'); }}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}
                  >
                    <GraduationCap size={16} style={{ color: '#0284c7' }} /> Edit Profile / Settings
                  </button>

                  <button 
                    onClick={() => { setShowDropdown(false); setActiveTab('reels'); }}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}
                  >
                    <Tv2 size={16} style={{ color: '#db2777' }} /> Educational Shorts
                  </button>

                  <div style={{ margin: '0.5rem 0', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', padding: '0.25rem 0.75rem', textTransform: 'uppercase' }}>
                      Switch Account
                    </div>
                    {testAccounts.map(acc => (
                      <button 
                        key={acc.id}
                        onClick={() => { loginSimulated(acc.email); setShowDropdown(false); setActiveTab('dashboard'); }}
                        style={{ width: '100%', padding: '0.375rem 0.75rem', borderRadius: '6px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#475569' }}
                      >
                        <img src={acc.avatarUrl} alt="Avatar" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                        {acc.fullName} ({acc.college})
                      </button>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                    <button 
                      onClick={() => { logout(); setShowDropdown(false); }}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none', background: '#fef2f2', color: '#dc2626', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <button onClick={() => { loginSimulated(testAccounts[0].email); setActiveTab('dashboard'); }} className="btn btn-secondary" style={{ borderRadius: '50px' }}>
                Demo: Aarav (Student)
              </button>
              <button onClick={() => { loginSimulated(testAccounts[0].email); setActiveTab('dashboard'); }} className="btn btn-accent glow-amber" style={{ borderRadius: '50px', padding: '0.625rem 1.5rem' }}>
                Launch Dashboard 🚀
              </button>
            </>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="animate-slide-up" style={{ textAlign: 'center', maxWidth: '840px', margin: '4rem auto 3rem auto' }}>
        <div className="tag tag-accent animate-float" style={{ marginBottom: '1.5rem', padding: '0.375rem 1rem', fontSize: '0.8125rem' }}>
          ✨ The #1 Peer-to-Peer Learning Platform for Campus Students
        </div>

        <h1 className="font-serif gradient-text" style={{ fontSize: '3.5rem', lineHeight: 1.15, marginBottom: '1.5rem' }}>
          Master Any Subject with Real-Time Peer Mentors
        </h1>

        <p style={{ fontSize: '1.125rem', color: '#57534e', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '680px', margin: '0 auto 2.5rem auto' }}>
          Open a live Doubt Room, get paired with peer tutors from your campus, launching screen-share WebRTC calls, educational reels, and earning campus rank awards.
        </p>

        {/* DEMO PERSONA SELECTOR CARDS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          {testAccounts.map(acc => (
            <div key={acc.id} onClick={() => { loginSimulated(acc.email); setActiveTab('dashboard'); }} className="card-premium glass-card" style={{ padding: '1rem 1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: '1px solid #e7e5e4', width: '240px', textAlign: 'left' }}>
              <img src={acc.avatarUrl} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #d97706' }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{acc.fullName}</div>
                <div style={{ fontSize: '0.75rem', color: '#78716c' }}>{acc.college} • Yr {acc.year}</div>
                <div style={{ fontSize: '0.6875rem', color: '#d97706', fontWeight: 600, marginTop: '0.125rem' }}>Log in & test →</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLATFORM STATS STRIP */}
      <section style={{ maxWidth: '1000px', margin: '0 auto 5rem auto', backgroundColor: '#ffffff', borderRadius: '24px', padding: '2rem', border: '1px solid #e7e5e4', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
        <div className="grid-3" style={{ textAlign: 'center' }}>
          <div>
            <div className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a' }}>12,450+</div>
            <div style={{ fontSize: '0.875rem', color: '#78716c', fontWeight: 500 }}>Active Campus Learners</div>
          </div>
          <div>
            <div className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#d97706' }}>98.4%</div>
            <div style={{ fontSize: '0.875rem', color: '#78716c', fontWeight: 500 }}>Academic Doubt Resolution</div>
          </div>
          <div>
            <div className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#059669' }}>50+</div>
            <div style={{ fontSize: '0.875rem', color: '#78716c', fontWeight: 500 }}>Top Indian Universities</div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS GRID */}
      <section style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 className="font-serif" style={{ textAlign: 'center', fontSize: '2.25rem', marginBottom: '2.5rem' }}>
          Built Around the Student Learning Loop
        </h2>

        <div className="grid-2">
          <div className="card-premium glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={26} />
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.375rem' }}>1. Live Doubt Rooms & WebRTC Calls</h3>
            <p style={{ color: '#57534e', fontSize: '0.9375rem', lineHeight: 1.5 }}>
              Open a doubt workspace, chat with a helper from your department, and start 1-click video calls with screen sharing.
            </p>
          </div>

          <div className="card-premium glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={26} />
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.375rem' }}>2. 8-Factor Smart Peer Discovery</h3>
            <p style={{ color: '#57534e', fontSize: '0.9375rem', lineHeight: 1.5 }}>
              Match algorithm evaluating college, department, skills, learning goals, and mutual connections for exact peer pairings.
            </p>
          </div>

          <div className="card-premium glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fce7f3', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tv2 size={26} />
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.375rem' }}>3. Instagram-Style Educational Shorts</h3>
            <p style={{ color: '#57534e', fontSize: '0.9375rem', lineHeight: 1.5 }}>
              Watch and post 60-second concept shorts with red heart likes, slide-up comments, and subject hashtag pills.
            </p>
          </div>

          <div className="card-premium glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={26} />
            </div>
            <h3 className="font-serif" style={{ fontSize: '1.375rem' }}>4. Campus Leaderboard & Badges</h3>
            <p style={{ color: '#57534e', fontSize: '0.9375rem', lineHeight: 1.5 }}>
              Earn XP, level badges, and peer coins for helping others, ascending to Rank #1 on your campus leaderboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
