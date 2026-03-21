import React from "https://esm.sh/react@18.3.1?dev";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?dev";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyATnLuZmfLZ15q6BJL1rp3VUTtt8MuQzkk",
  authDomain: "shimisk-feedback.firebaseapp.com",
  projectId: "shimisk-feedback",
  storageBucket: "shimisk-feedback.firebasestorage.app",
  messagingSenderId: "218198792768",
  appId: "1:218198792768:web:90370a425e6aa78cdf9da5"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

const h = React.createElement;

function isPermissionDenied(error) {
  return error?.code === "permission-denied" || error?.message?.toLowerCase().includes("permission");
}

function formatTime(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate?.() || new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (secs < 60) return "now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

function App() {
  const [user, setUser] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authBusy, setAuthBusy] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [feedbacks, setFeedbacks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [expandedId, setExpandedId] = React.useState(null);
  const [deleting, setDeleting] = React.useState(null);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });

    return unsubscribeAuth;
  }, []);

  React.useEffect(() => {
    if (!user) {
      setFeedbacks([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(collection(db, "feedback"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data()
        }));
        setFeedbacks(items);
        setLoading(false);
      }, (err) => {
        if (isPermissionDenied(err)) {
          setError("This account is not allowed to read feedback. Update Firestore rules to only allow your admin Google account.");
        } else {
          setError(err.message);
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return undefined;
    }
  }, [user]);

  const handleSignIn = async (event) => {
    event?.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setAuthBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setAuthBusy(true);
    try {
      await signOut(auth);
      setExpandedId(null);
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "feedback", id));
      setDeleting(null);
    } catch (err) {
      if (isPermissionDenied(err)) {
        setError("This account is not allowed to delete feedback.");
      } else {
        setError(err.message);
      }
      setDeleting(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return h('div', { style: { minHeight: "100vh", background: "#f5f5f5" } },
    h('div', { className: "header" },
      h('h1', null, "Feedback"),
      h('p', null, user ? `${feedbacks.length} submission${feedbacks.length !== 1 ? 's' : ''}` : "Admin access required")
    ),

    h('div', { className: "container" },
      h('div', { className: "controls" },
        user && h('button', { onClick: () => window.location.reload() }, "🔄 Refresh"),
        user && h('button', { className: "secondary-btn", onClick: handleSignOut }, "Sign out")
      ),

      error && h('div', { className: "error" }, error),

      authLoading && h('div', { className: "loading" }, "Checking admin session…"),

      !authLoading && !user && h('div', { className: "auth-card" },
        h('h2', null, "Private Admin Access"),
        h('p', null, "Sign in with your admin email and password to read and delete feedback."),
        h('form', { className: "auth-form", onSubmit: handleSignIn },
          h('label', { className: "auth-label", htmlFor: "admin-email" }, "Email"),
          h('input', {
            id: "admin-email",
            className: "auth-input",
            type: "email",
            autoComplete: "username",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "you@example.com"
          }),
          h('label', { className: "auth-label", htmlFor: "admin-password" }, "Password"),
          h('input', {
            id: "admin-password",
            className: "auth-input",
            type: "password",
            autoComplete: "current-password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            placeholder: "Password"
          }),
          h('button', { type: "submit", disabled: authBusy }, authBusy ? "Signing in…" : "Sign in")
        )
      ),

      !authLoading && user && h('div', { className: "user-pill" },
        `Signed in as ${user.email || user.uid}`
      ),

      user && loading && h('div', { className: "loading" }, "Loading feedback…"),

      user && !loading && feedbacks.length === 0 && h('div', { className: "empty" },
        h('p', null, "No feedback yet. 💭"),
        h('p', { style: { fontSize: "12px", marginTop: "8px" } }, "Feedback from your apps will appear here.")
      ),

      user && !loading && feedbacks.length > 0 && h('div', { className: "feedback-list" },
        feedbacks.map(fb =>
          h('div', {
            key: fb.id,
            className: `feedback-item${expandedId === fb.id ? " expanded" : ""}`,
            onClick: () => toggleExpand(fb.id)
          },
            h('div', { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between" } },
              h('div', { className: "feedback-app" }, fb.app),
              h('span', { className: `feedback-type ${fb.type}` }, fb.type === "bug" ? "🐛 Bug" : "💡 Suggestion")
            ),
            h('div', { className: "feedback-message" }, fb.message),
            h('div', { className: "feedback-time" }, formatTime(fb.timestamp)),

            expandedId === fb.id && h('div', { className: "feedback-actions" },
              h('button', {
                className: "delete-btn",
                onClick: (e) => {
                  e.stopPropagation();
                  if (confirm("Delete this feedback?")) {
                    handleDelete(fb.id);
                  }
                },
                disabled: deleting === fb.id
              }, deleting === fb.id ? "Deleting…" : "🗑️ Delete")
            )
          )
        )
      )
    )
  );
}

const root = createRoot(document.getElementById("root"));
root.render(h(App));
