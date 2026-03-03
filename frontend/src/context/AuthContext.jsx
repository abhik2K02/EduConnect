import { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    async function register(email, password, role) {
        console.log("Starting register auth...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Auth success! UID:", user.uid);

        // Save the role to Firestore
        console.log("Attempting to write role to Firestore...");
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: role,
            createdAt: new Date().toISOString()
        });
        console.log("Role written to Firestore successfully!");

        // Set role *after* Firestore update, let onAuthStateChanged handle the rest naturally
        setUserRole(role);
        return user;
    }

    async function login(email, password) {
        console.log("Starting login auth...");
        alert("1. Logging in with Firebase Auth...");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Login success! UID:", userCredential.user.uid);
        alert(`2. Auth successful. Fetching role for UID: ${userCredential.user.uid}...`);
        const role = await fetchUserRole(userCredential.user.uid);
        alert(`3. fetchUserRole returned: ${role}`);
        return { user: userCredential.user, role };
    }

    function logout() {
        return signOut(auth);
    }

    async function fetchUserRole(uid, retries = 3) {
        try {
            console.log("Fetching user role from Firestore for UID:", uid);
            const userDoc = await getDoc(doc(db, "users", uid));
            console.log("Firestore fetch complete.");

            if (userDoc.exists() && userDoc.data().role) {
                const role = userDoc.data().role;
                setUserRole(role);
                return role;
            } else if (retries > 0) {
                // If the doc isn't there yet (race condition on registration), wait and retry
                console.log(`Role doc not found. Retrying in 1s... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return fetchUserRole(uid, retries - 1);
            } else {
                console.warn("No user role found in Firestore after retries!");
                setUserRole(null);
                return null;
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
            setUserRole(null);
            return null;
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                await fetchUserRole(user.uid);
            } else {
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
