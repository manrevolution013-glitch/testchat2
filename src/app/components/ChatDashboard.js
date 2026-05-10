"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Hash, User, Send, Menu, MessageSquare, X, Flag, Edit2, Plus, Users, FileText } from 'lucide-react';
import Header from './Header';
import ReportModal from './ReportModal';
import config from '../../config';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'cuckchat';

export default function ChatDashboard() {
  const { dashboard } = config;
  const [token, setToken] = useState(null);
  const [myUsername, setMyUsername] = useState(null);
  const [myAvatar, setMyAvatar] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  
  // Sign Up Form State
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  
  // Profile Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  const router = useRouter();

  // Helper to get avatar URL
  const getAvatarUrl = (username) => {
      return `${API_URL}/avatar/${username}`;
  };

  // Common headers
  const getHeaders = (opts = {}) => {
      const base = {
        'X-Site-Name': SITE_NAME
      };
      if (opts.auth && token) {
        base['Authorization'] = `Bearer ${token}`;
      }
      if (opts.json) {
        base['Content-Type'] = 'application/json';
      }
      return base;
  };

  // Helper to check response status
  const checkResponse = (res) => {
    if (res.status === 403) {
      localStorage.removeItem('chat_token');
      localStorage.removeItem('chat_username');
      localStorage.removeItem('chat_avatar');
      setToken(null);
      router.push('/');
      return false;
    }
    return true;
  };

  // Load auth state on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('chat_token');
    const storedUsername = localStorage.getItem('chat_username');
    const storedAvatar = localStorage.getItem('chat_avatar');
    
    if (!storedToken) {
      router.push('/');
      return;
    }
    
    setToken(storedToken);
    setMyUsername(storedUsername);
    
    // Fix old DiceBear URLs in localStorage
    let avatarToUse = storedAvatar;
    if (storedAvatar && storedAvatar.includes('api.dicebear.com')) {
        avatarToUse = getAvatarUrl(storedUsername);
        localStorage.setItem('chat_avatar', avatarToUse);
    }
    
    setMyAvatar(getAvatarUrl(storedUsername));
    setNewUsername(storedUsername);
    setIsGuest(storedUsername && storedUsername.startsWith('Guest'));
  }, [router]);

  const handleChangeUsername = async () => {
      if (!newUsername || newUsername.length < 3) {
          showToast(dashboard.modals.username.minChars);
          return;
      }

      if (isGuest) {
          setSignUpUsername(newUsername);
          setSignUpModalOpen(true);
          showToast("You need to register to change nickname.");
          return;
      }
      
      try {
          const res = await fetch(`${API_URL}/user/change-username`, {
              method: 'POST',
              headers: getHeaders({ auth: true, json: true }),
              body: JSON.stringify({ newUsername })
          });

          if (!checkResponse(res)) return;

          const data = await res.json();
          if (res.ok) {
              setToken(data.token);
              setMyUsername(data.username);
              localStorage.setItem('chat_token', data.token);
              localStorage.setItem('chat_username', data.username);
              setIsGuest(false);
              setIsEditingName(false);
              showToast(dashboard.modals.username.success);
          } else {
              showToast(data.error || dashboard.modals.username.error);
          }
      } catch (err) {
          showToast(dashboard.messages.connectionError);
      }
  };

  const [chatMode, setChatMode] = useState('public');
  const [dataVersions, setDataVersions] = useState({ users: 0, channels: 0, messages: 0, notifications: 0 });
  const [targetUser, setTargetUser] = useState(null);
  const [channelId, setChannelId] = useState(null);
  const [currentChannelName, setCurrentChannelName] = useState(dashboard.publicChat);

  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [unreadCounts, setUnreadCounts] = useState({ public: 0 });
  const [toast, setToast] = useState(null); 

  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [signUpModalOpen, setSignUpModalOpen] = useState(false);

  // Refs
  const chatModeRef = useRef('public');
  const targetUserRef = useRef(null);
  const channelIdRef = useRef(null);
  const lastPollTimeRef = useRef(Date.now());
  const latestMessagesRef = useRef([]);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const dataVersionsRef = useRef({ messages: 0, notifications: 0 });

  const handleSocialLogin = async (providerName, isSignUp = false) => {
      try {
          const provider = googleProvider;
          const result = await signInWithPopup(auth, provider);
          const token = await result.user.getIdToken();
          
          const res = await fetch(`${API_URL}/login/social`, {
              method: 'POST',
              headers: getHeaders({ json: true }),
              body: JSON.stringify({ token, isSignUp })
          });
          const data = await res.json();
          if (res.ok) {
              setToken(data.token);
              setMyUsername(data.username);
              setMyAvatar();
              localStorage.setItem('chat_token', data.token);
              localStorage.setItem('chat_username', data.username);
              if (data.avatar) localStorage.setItem('chat_avatar', data.avatar);
              setIsGuest(false); // They are now social users
              setSignInModalOpen(false);
              setSignUpModalOpen(false);
              showToast("Login successful");
              
              // Force reload to get fresh data
              window.location.reload();
          } else {
              showToast(data.error || "Login failed");
          }
      } catch (err) {
          console.error(err);
          showToast(dashboard.messages.connectionError);
      }
  };

  const handleSignUp = async () => {
      if (!signUpUsername || !signUpPassword) {
          showToast("Username and password are required");
          return;
      }
      if (signUpPassword !== signUpConfirmPassword) {
          showToast("Passwords do not match");
          return;
      }
      if (signUpUsername.length < 3) {
          showToast(dashboard.modals.username.minChars);
          return;
      }

      try {
          const res = await fetch(`${API_URL}/register`, {
              method: 'POST',
              headers: getHeaders({ json: true }),
              body: JSON.stringify({ 
                  username: signUpUsername, 
                  password: signUpPassword,
                  email: signUpEmail 
              })
          });
          const data = await res.json();
          if (res.ok) {
              setToken(data.token);
              setMyUsername(data.username);
              setMyAvatar(data.avatar);
              localStorage.setItem('chat_token', data.token);
              localStorage.setItem('chat_username', data.username);
              if (data.avatar) localStorage.setItem('chat_avatar', data.avatar);
              setIsGuest(false);
              setSignUpModalOpen(false);
              showToast("Registration successful");
              window.location.reload();
          } else {
              showToast(data.error || "Registration failed");
          }
      } catch (err) {
          showToast(dashboard.messages.connectionError);
      }
  };

  const handleLogout = () => {
      setToken(null);
      setMyUsername(null);
      localStorage.removeItem('chat_token');
      localStorage.removeItem('chat_username');
      localStorage.removeItem('chat_avatar');
      router.push('/');
  };

  const handleMyProfileClick = async () => {
      try {
        if (isEditingName) return;
          const res = await fetch(`${API_URL}/me`, {
             headers: getHeaders({ auth: true })
          });
          if (res.ok) {
              const data = await res.json();
              setSelectedUserProfile(data);
              setProfileModalOpen(true);
          } else {
              showToast("Could not fetch profile");
          }
      } catch (e) {
          showToast(dashboard.messages.connectionError);
      }
  };

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!token) return;

    chatModeRef.current = chatMode;
    targetUserRef.current = targetUser;
    channelIdRef.current = channelId;
    
    // Reset messages and load history when chat changes
    setMessages([]);
    hasMoreRef.current = true;
    loadHistory();

    // Reset unread count for current view
    setUnreadCounts(prev => {
        let key = chatMode === 'dm' ? targetUser : (chatMode === 'channel' ? channelId : 'public');
        if (!key) key = 'public';
        const newCounts = { ...prev };
        newCounts[key] = 0;
        return newCounts;
    });

  }, [chatMode, targetUser, channelId, token]);

  // Polling Logic
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      await fetchUsers(true);
      await fetchChannels();
      await pollNotifications();
    };
    fetchData();

    // Fast interval for messages and notifications (3 seconds)
    const messagesInterval = setInterval(async () => {
        await pollNewMessages();
        await pollNotifications();
    }, 3000);

    // Slower interval for users and channels (15 seconds)
    const usersChannelsInterval = setInterval(async () => {
        await fetchUsers();
        await fetchChannels();
    }, 15000); 

    return () => {
      clearInterval(messagesInterval);
      clearInterval(usersChannelsInterval);
    };
  }, [token, chatMode, targetUser, channelId]);

  const usersLimit = 20;
  const hasMoreUsersRef = useRef(true);
  const loadingUsersRef = useRef(false);

  const fetchUsers = async (reset = true) => {
      if (loadingUsersRef.current) return;
      if (!reset && !hasMoreUsersRef.current) return;
      
      loadingUsersRef.current = true;
      try {
        const skip = reset ? 0 : users.length;
        const res = await fetch(`${API_URL}/users?limit=${usersLimit}&skip=${skip}`, {
           headers: getHeaders({ auth: true })
        });
        if (!checkResponse(res)) return;
        if (res.ok) {
            const newUsers = await res.json();
            
            if (newUsers.length < usersLimit) {
                hasMoreUsersRef.current = false;
            } else {
                hasMoreUsersRef.current = true;
            }
            
            if (reset) {
                setUsers(newUsers);
            } else {
                setUsers(prev => {
                    const existing = new Set(prev.map(u => u.username));
                    const unique = newUsers.filter(u => !existing.has(u.username));
                    return [...prev, ...unique];
                });
            }
        }
      } catch (e) {} finally {
          loadingUsersRef.current = false;
      }
  };

  const fetchChannels = async () => {
      try {
        const res = await fetch(`${API_URL}/channels`, {
           headers: getHeaders({ auth: true })
        });
        if (!checkResponse(res)) return;
        if (res.ok) setChannels(await res.json());
      } catch (e) {}
  };

  const pollNewMessages = async () => {
      if (loadingRef.current) return;

      const currentMessages = latestMessagesRef.current;
      const lastMsg = currentMessages[currentMessages.length - 1];
      const afterTimestamp = lastMsg ? lastMsg.timestamp : Date.now() - 5000; 

      try {
          let url = `${API_URL}/messages?type=${chatMode}&afterTimestamp=${afterTimestamp}&version=${dataVersionsRef.current.messages}`;
          if (chatMode === 'dm') url += `&targetUser=${targetUser}`;
          else if (chatMode === 'channel') url += `&channelId=${channelId}`;

          const res = await fetch(url, {
              headers: getHeaders({ auth: true })
          });

          if (!checkResponse(res)) return;

          if (res.ok) {
              const data = await res.json();
              if (!data.notModified) {
                  const newVersion = data.version;
                  if (newVersion > dataVersionsRef.current.messages) {
                      dataVersionsRef.current.messages = newVersion;
                      setDataVersions(prev => ({ ...prev, messages: newVersion }));
                  }
                  
                  const newMsgs = data.messages || [];
                  
                  if (newMsgs.length > 0) {
                      setMessages(prev => {
                          const existingIds = new Set(prev.map(m => m.id));
                          const uniqueNewMsgs = newMsgs.filter(m => !existingIds.has(m.id));
                          if (uniqueNewMsgs.length === 0) return prev;
                          return [...prev, ...uniqueNewMsgs];
                      });
                      
                      if (messagesContainerRef.current) {
                        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
                        if (scrollHeight - scrollTop - clientHeight < 150) {
                            setTimeout(() => scrollToBottom(), 100);
                        }
                      }
                  }
              }
          }
      } catch (err) {
          console.error("Polling error", err);
      }
  };

  const pollNotifications = async () => {
      const since = lastPollTimeRef.current;
      try {
          const res = await fetch(`${API_URL}/notifications?since=${since}&version=${dataVersionsRef.current.messages}`, {
              headers: getHeaders({ auth: true })
          });
          
          if (!checkResponse(res)) return;

          if (res.ok) {
              const data = await res.json();
              if (!data.notModified) {
                  if (data.version > dataVersionsRef.current.messages) {
                      dataVersionsRef.current.messages = data.version;
                      setDataVersions(prev => ({ ...prev, messages: data.version }));
                  }
                  
                  const updates = data.notifications || [];
                  if (updates.length > 0) {
                      lastPollTimeRef.current = Date.now();
                      
                      updates.forEach(update => {
                          let key;
                          if (update.type === 'public') key = 'public';
                          else if (update.type === 'dm') key = update.sender;
                          else if (update.type === 'channel') key = update.channelId;
                          
                          const currentKey = chatMode === 'dm' ? targetUser : (chatMode === 'channel' ? channelId : 'public');
                          
                          if (key !== currentKey && update.sender !== myUsername) {
                              setUnreadCounts(prev => ({
                                  ...prev,
                                  [key]: (prev[key] || 0) + 1
                              }));
                              
                              let msg = dashboard.notifications.newMessage + ' ';
                              if (update.type === 'dm') msg += update.sender;
                              else if (update.type === 'channel') msg += dashboard.notifications.channel;
                              else msg += dashboard.notifications.channel; 
                              
                              showToast(msg);
                          }
                      });
                  }
              }
          }
      } catch (err) { }
  };

  const handleUserScroll = (e) => {
      const { scrollTop, clientHeight, scrollHeight } = e.target;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
          fetchUsers(false);
      }
  };

  const showToast = (msg) => {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
  };

  const loadHistory = async (beforeTimestamp = null) => {
    if (loadingRef.current || (!hasMoreRef.current && beforeTimestamp)) return;
    loadingRef.current = true;

    try {
      let url = `${API_URL}/messages?type=${chatMode}&beforeTimestamp=${beforeTimestamp || ''}`;
      if (chatMode === 'dm') url += `&targetUser=${targetUser}`;
      else if (chatMode === 'channel') url += `&channelId=${channelId}`;

      const res = await fetch(url, {
        headers: getHeaders({ auth: true })
      });
      
      if (!checkResponse(res)) return;

      if (res.ok) {
        const history = await res.json();
        
        if (history.length < 50) {
          hasMoreRef.current = false;
        }

        if (beforeTimestamp) {
            setMessages(prev => [...history, ...prev]);
        } else {
            setMessages(history);
            setTimeout(() => scrollToBottom(), 100);
        }
      }
    } catch (err) { console.error(err); }
    finally { loadingRef.current = false; }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMoreRef.current && messages.length > 0) {
        const oldestMsg = messages[0];
        const oldScrollHeight = e.target.scrollHeight;
        
        loadHistory(oldestMsg.timestamp).then(() => {
            requestAnimationFrame(() => {
                const newScrollHeight = e.target.scrollHeight;
                e.target.scrollTop = newScrollHeight - oldScrollHeight;
            });
        });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text) => {
    try {
        const payload = {
            text,
            type: chatMode,
        };
        if (chatMode === 'dm') payload.targetUser = targetUser;
        if (chatMode === 'channel') payload.channelId = channelId;

        const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: getHeaders({ auth: true, json: true }),
            body: JSON.stringify(payload)
        });

        if (!checkResponse(res)) return;

        if (res.ok) {
            const sentMsg = await res.json();
            setMessages(prev => {
                if (prev.some(m => m.id === sentMsg.id)) return prev;
                return [...prev, sentMsg];
            });
            setTimeout(() => scrollToBottom(), 100);
        } else {
            showToast(dashboard.messages.sendError);
        }
    } catch (err) {
        showToast(dashboard.messages.connectionError);
    }
  };

  const handleReportClick = (msg) => {
      const reportedUser = msg.sender || msg.username;
      if (reportedUser === myUsername) return; 

      setReportData({
          messageId: msg.id,
          reportedUser: reportedUser,
          content: msg.text
      });
      setReportModalOpen(true);
  };

  const handleSubmitReport = async (reason) => {
      if (!reportData) return;

      try {
          const res = await fetch(`${API_URL}/report`, {
              method: 'POST',
              headers: getHeaders({ auth: true, json: true }),
              body: JSON.stringify({
                  ...reportData,
                  reason
              })
          });

          if (!checkResponse(res)) return;

          if (res.ok) {
              showToast(dashboard.modals.report.success);
          } else {
              showToast(dashboard.modals.report.error);
          }
      } catch (err) {
          console.error(err);
          showToast(dashboard.messages.connectionError);
      } finally {
          setReportModalOpen(false);
          setReportData(null);
      }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp;
    const min = 60 * 1000;
    const hour = 60 * min;
    const day = 24 * hour;

    if (diff < min) return dashboard.online;
    if (diff < hour) return dashboard.timeAgo.m.replace('{t}', Math.floor(diff / min));
    if (diff < day) return dashboard.timeAgo.h.replace('{t}', Math.floor(diff / hour));
    return dashboard.timeAgo.d.replace('{t}', Math.floor(diff / day));
  };

  const getAvatar = (username) => {
      if (username === myUsername) return myAvatar;
      const user = users.find(u => u.username === username);
      return user?.avatar || getAvatarUrl(username);
  };

  return (
    <div className="app-layout">
      <Header />
      
      {toast && (
          <div className="toast-notification">
              <MessageSquare size={18} />
              <span>{toast}</span>
              <X size={16} onClick={() => setToast(null)} style={{cursor:'pointer', marginLeft:'auto'}} />
          </div>
      )}

      {/* Profile Modal */}
      {profileModalOpen && selectedUserProfile && (
        <div className="modal-overlay" onClick={() => setProfileModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedUserProfile.username}</h3>
              <button className="close-btn" onClick={() => setProfileModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body" style={{textAlign:'center'}}>
                 <img 
                    src={getAvatarUrl(selectedUserProfile.username)} 
                    style={{width: 80, height: 80, borderRadius: '50%', marginBottom: 15, objectFit: 'cover'}} 
                 />
                 <div style={{marginBottom: 10, color: 'var(--text-muted)'}}>
                    <div style={{marginBottom: 5}}>
                        <strong>Joined:</strong> {selectedUserProfile.createdAt ? new Date(selectedUserProfile.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <div>
                        <strong>Messages Sent:</strong> {selectedUserProfile.messageCount || 0}
                    </div>
                 </div>
                 
                 {selectedUserProfile.username !== myUsername && (
                     <button className="submit-btn" style={{marginTop: 20, width: '100%'}} onClick={() => {
                         setChatMode('dm');
                         setTargetUser(selectedUserProfile.username);
                         setProfileModalOpen(false);
                         setMobileMenuOpen(false);
                     }}>Send Message</button>
                 )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        onSubmit={handleSubmitReport}
        reportedUser={reportData?.reportedUser}
      />

      {/* Rules Modal */}
      {rulesModalOpen && (
        <div className="modal-overlay" onClick={() => setRulesModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <div className="modal-header">
              <h3>{config.pages.terms.title}</h3>
              <button className="close-btn" onClick={() => setRulesModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{textAlign: 'left', maxHeight: '70vh', overflowY: 'auto'}}>
              <p style={{marginBottom: '1.5rem', color: 'var(--text-muted)'}}>
                {config.pages.terms.description}
              </p>
              {config.pages.terms.content.map((section, idx) => (
                <div key={idx} style={{marginBottom: '2rem'}}>
                  <h4 style={{color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.1rem'}}>
                    {section.heading}
                  </h4>
                  <p style={{color: 'var(--text)', lineHeight: '1.6'}}>
                    {section.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="submit-btn" onClick={() => setRulesModalOpen(false)}>
                {dashboard.modals.rules?.close || dashboard.modals.report.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      {signInModalOpen && (
        <div className="modal-overlay" onClick={() => setSignInModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{dashboard.auth.signIn}</h3>
              <button className="close-btn" onClick={() => setSignInModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
                <button onClick={() => handleSocialLogin('google')} className="submit-btn" style={{width:'100%', marginBottom:10, background:'#db4437'}}>{dashboard.auth.signInGoogle}</button>
                <div style={{margin:'15px 0', color:'var(--text-muted)'}}>{dashboard.auth.or}</div>
                {/* Normal Login Form Placeholder */}
                <input type="text" placeholder={dashboard.auth.username} className="report-select" style={{marginBottom:10}} />
                <input type="password" placeholder={dashboard.auth.password} className="report-select" style={{marginBottom:10}} />
                <button className="submit-btn" style={{width:'100%'}}>{dashboard.auth.signIn}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {signUpModalOpen && (
        <div className="modal-overlay" onClick={() => setSignUpModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{dashboard.auth.signUp}</h3>
              <button className="close-btn" onClick={() => setSignUpModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
                <input 
                    type="text" 
                    placeholder={dashboard.auth.username} 
                    className="report-select" 
                    style={{marginBottom:10}}
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                />
                <input 
                    type="email" 
                    placeholder={dashboard.auth.email} 
                    className="report-select" 
                    style={{marginBottom:10}}
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                />
                <input 
                    type="password" 
                    placeholder={dashboard.auth.password} 
                    className="report-select" 
                    style={{marginBottom:10}}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                />
                <input 
                    type="password" 
                    placeholder={dashboard.auth.confirmPassword} 
                    className="report-select" 
                    style={{marginBottom:10}}
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                />
                <button className="submit-btn" style={{width:'100%', marginBottom:10}} onClick={handleSignUp}>{dashboard.auth.signUp}</button>
                <div style={{margin:'15px 0', color:'var(--text-muted)'}}>{dashboard.auth.or}</div>
                <button onClick={() => handleSocialLogin('google', true)} className="submit-btn" style={{width:'100%', marginBottom:10, background:'#db4437'}}>{dashboard.auth.signInGoogle}</button>
            </div>
          </div>
        </div>
      )}

      <div className="app-container">
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
            <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* LEFT Sidebar: Channels */}
        <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{zIndex: 102}}>
            <div className="sidebar-header">
                <div style={{display:'flex', alignItems:'center', gap: 10, flex:1, overflow:'hidden', cursor:'pointer'}}>
                    <div style={{position:'relative'}}>
                        <img 
                            src={myAvatar} 
                            alt="Avatar" 
                            style={{width: 32, height: 32, borderRadius: '50%', border: '1px solid #444', objectFit: 'cover'}} 
                        />
                    </div>
                    
                    {isEditingName ? (
                        <div style={{display:'flex', alignItems:'center', gap: 5, flex:1}}>
                            <input 
                                type="text" 
                                value={newUsername} 
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="username-edit-input"
                                autoFocus
                            />
                            <button onClick={handleChangeUsername} className="icon-btn"><Send size={14}/></button>
                            <button onClick={() => setIsEditingName(false)} className="icon-btn"><X size={14}/></button>
                        </div>
                    ) : (
                        <div style={{display:'flex', alignItems:'center', gap: 5, flex:1, overflow:'hidden'}}>
                            <span onClick={handleMyProfileClick} className="user-profile" style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                {myUsername || dashboard.loading}
                            </span>
                            {isGuest && (
                                <Edit2 
                                    size={14} 
                                    className="edit-btn" 
                                    onClick={() => setIsEditingName(true)} 
                                    title={dashboard.changeUsername}
                                    style={{cursor:'pointer', opacity:0.7, flexShrink:0}}
                                />
                            )}
                        </div>
                    )}
                </div>
                <LogOut size={18} className="logout-btn" onClick={handleLogout} title={dashboard.logout} />
            </div>
            
            <div className="sidebar-menu" onScroll={handleUserScroll}>
                <div className="section-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span>{dashboard.channelsTitle}</span>
                </div>
                
                <div 
                    className={`menu-item ${chatMode === 'public' ? 'active' : ''}`}
                    onClick={() => { setChatMode('public'); setChannelId(null); setCurrentChannelName(dashboard.publicChat); setTargetUser(null); setMobileMenuOpen(false); }}
                >
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <Hash size={18} /> {dashboard.publicChat}
                    </div>
                    {unreadCounts['public'] > 0 && (
                        <span className="badge">{unreadCounts['public']}</span>
                    )}
                </div>

                {channels.map(channel => (
                    <div 
                        key={channel.id}
                        className={`menu-item ${chatMode === 'channel' && channelId === channel.id ? 'active' : ''}`}
                        onClick={() => { setChatMode('channel'); setChannelId(channel.id); setCurrentChannelName(channel.name); setTargetUser(null); setMobileMenuOpen(false); }}
                    >
                        <div style={{display:'flex', alignItems:'center', gap:10}}>
                            <Hash size={18} /> {channel.name}
                        </div>
                        {unreadCounts[channel.id] > 0 && (
                            <span className="badge">{unreadCounts[channel.id]}</span>
                        )}
                    </div>
                ))}

                {/* Mobile Users List */}
                <div className="mobile-only-users">
                    <div className="section-title" style={{marginTop: 30}}>
                        <span>{dashboard.usersTitle}</span>
                    </div>
                    {users.map(u => {
                        const isOnline = u.lastActivity && (Date.now() - u.lastActivity < 5 * 60 * 1000); 
                        return (
                            <div 
                            key={`mobile-${u.username}`}
                            className={`menu-item ${chatMode === 'dm' && targetUser === u.username ? 'active' : ''}`}
                            onClick={() => { handleUserClick(u); setMobileMenuOpen(false); }}
                            >
                            <div style={{display:'flex', alignItems:'center', gap:10, flex: 1}}>
                                <div style={{position: 'relative'}}>
                                    <img 
                                        src={getAvatarUrl(u.username)} 
                                        alt={u.username}
                                        style={{width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', background: '#333'}}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: isOnline ? '#2ecc71' : '#e74c3c', 
                                        border: '1px solid var(--bg-panel)'
                                    }} />
                                </div>
                                <span style={{fontSize: '0.9rem'}}>{u.username}</span>
                            </div>
                            {unreadCounts[u.username] > 0 && (
                                <span className="badge">{unreadCounts[u.username]}</span>
                            )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {isGuest && (
                <div style={{padding: '15px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <button className="submit-btn" onClick={() => setSignInModalOpen(true)} style={{width:'100%'}}>{dashboard.auth.signIn}</button>
                    <button className="cancel-btn" onClick={() => setSignUpModalOpen(true)} style={{width:'100%', textAlign:'center'}}>{dashboard.auth.signUp}</button>
                </div>
            )}
        </div>

        {/* MIDDLE: Chat Area */}
        <div className="chat-area">
            <div className="chat-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', alignItems:'center'}}>
                <Menu className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
                {chatMode === 'public' ? (
                    <><Hash size={20} style={{marginRight:10}} /> {dashboard.publicChat}</>
                ) : chatMode === 'channel' ? (
                    <><Hash size={20} style={{marginRight:10}} /> {currentChannelName}</>
                ) : (
                    <><User size={20} style={{marginRight:10}} /> {targetUser}</>
                )}
            </div>
            {(chatMode === 'public' || chatMode === 'channel') && (
                <button 
                    onClick={() => setRulesModalOpen(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.9rem'
                    }}
                    title=""
                >
                    <FileText size={18} />
                    <span>{dashboard.rulesButton}</span>
                </button>
            )}
            </div>

            <div 
                className="messages-container" 
                onScroll={handleScroll} 
                ref={messagesContainerRef}
            >
                {loadingRef.current && hasMoreRef.current && <div style={{textAlign:'center', padding:10, color:'#666'}}>{dashboard.loading}</div>}
                
                {messages.map((msg, idx) => {
                    const isMe = (msg.sender || msg.username) === myUsername;
                    const senderName = msg.sender || msg.username;
                    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const avatar = getAvatar(senderName);

                    return (
                    <div key={msg.id || idx} className={`message-row ${isMe ? 'sent' : 'received'}`} style={{
                        display: 'flex', 
                        flexDirection: isMe ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        marginBottom: 15,
                        gap: 10
                    }}>
                        {!isMe && (
                            <img 
                                src={getAvatarUrl(senderName)} 
                                alt={senderName} 
                                title={senderName}
                                style={{width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#333', marginBottom: 5}}
                            />
                        )}

                        <div className={`message ${isMe ? 'sent' : 'received'}`} style={{position:'relative'}}>
                            <div className="message-header">
                                {!isMe && (
                                <span className="sender-name">{senderName}</span>
                                )}
                                {!isMe && (
                                    <button 
                                        className="report-btn" 
                                        title={dashboard.messages.report}
                                        onClick={() => handleReportClick(msg)}
                                    >
                                        <Flag size={12} />
                                    </button>
                                )}
                            </div>
                            <div className="message-content">{msg.text}</div>
                            <span className="msg-time">{timeStr}</span>
                        </div>
                    </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <MessageInput onSend={handleSendMessage} placeholder={dashboard.messagePlaceholder} />
        </div>

        {/* RIGHT Sidebar: Users */}
        <div className="sidebar right-sidebar" style={{display: mobileMenuOpen ? 'none' : 'flex'}}>
             <div className="sidebar-header">
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <Users size={20} /> <span>{dashboard.usersTitle}</span>
                </div>
             </div>
             <div className="sidebar-menu" onScroll={handleUserScroll}>
                {users.map(u => {
                    const isOnline = u.lastActivity && (Date.now() - u.lastActivity < 5 * 60 * 1000); 
                    return (
                        <div 
                        key={u.username}
                        className={`menu-item ${chatMode === 'dm' && targetUser === u.username ? 'active' : ''}`}
                        onClick={() => { setSelectedUserProfile(u); setProfileModalOpen(true); }}
                        >
                        <div style={{display:'flex', alignItems:'center', gap:10, flex: 1}}>
                            <div style={{position: 'relative'}}>
                                <img 
                                    src={getAvatarUrl(u.username)} 
                                    alt={u.username}
                                    style={{width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#333'}}
                                />
                                <span style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    backgroundColor: isOnline ? '#2ecc71' : '#e74c3c', 
                                    border: '2px solid var(--bg-panel)'
                                }} />
                            </div>
                            <div style={{display:'flex', flexDirection:'column'}}>
                                <span>{u.username}</span>
                                <span style={{fontSize: '0.75rem', color: isOnline ? '#2ecc71' : 'rgba(255,255,255,0.5)'}}>
                                    {isOnline ? dashboard.online : formatTimeAgo(u.lastActivity)}
                                </span>
                            </div>
                        </div>
                        {unreadCounts[u.username] > 0 && (
                            <span className="badge">{unreadCounts[u.username]}</span>
                        )}
                        </div>
                    );
                })}
             </div>
        </div>
      </div>
    </div>
  );
}

function MessageInput({ onSend, placeholder }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="input-area">
      <input 
        type="text" 
        placeholder={placeholder} 
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && handleSend()}
      />
      <button className="send-btn" onClick={handleSend} disabled={!text.trim()}>
        <Send size={20} />
      </button>
    </div>
  );
}
