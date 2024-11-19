const firebaseConfig = {
  apiKey: "AIzaSyBBrtnfSu8yLtB1gpnU3bsXvFBg9dVQ6xI",
  authDomain: "avaliacoes-feira.firebaseapp.com",
  databaseURL: "https://avaliacoes-feira-default-rtdb.firebaseio.com",
  projectId: "avaliacoes-feira",
  storageBucket: "avaliacoes-feira.firebasestorage.app",
  messagingSenderId: "664519192084",
  appId: "1:664519192084:web:d4e6fcde297fba81814101",
  measurementId: "G-VJLLSXHEQN"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
window.db = firebase.database();