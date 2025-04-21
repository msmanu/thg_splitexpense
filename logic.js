// logic.js - Firebase Firestore version with live sync

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, updateDoc,
  onSnapshot, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVggn2ylUAG9AdDFYAB6KEyphR_vkqc-0",
  authDomain: "thehandsomegangexpenses.firebaseapp.com",
  projectId: "thehandsomegangexpenses",
  storageBucket: "thehandsomegangexpenses.firebasestorage.app",
  messagingSenderId: "66696869906",
  appId: "1:66696869906:web:031ed019cdadbfac66c0cb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const people = ["Pineapple", "Akele", "Nimaanga", "Zillet", "Shineeee", "Madhurameyy"];

async function addExpense() {
  const splitTitle = localStorage.getItem('currentSplit');
  const payer = document.getElementById('payer').value;
  const type = document.getElementById('splitType').value;
  const amount = parseFloat(document.getElementById('amount').value);
  if (!amount || amount <= 0) return alert("Enter valid amount");

  const shares = {};
  if (type === "equal") {
    const share = amount / people.length;
    people.forEach(p => shares[p] = share);
  } else {
    const divs = document.querySelectorAll('#customSplit .person');
    let total = 0;
    divs.forEach(div => {
      const name = div.dataset.name;
      const val = parseFloat(div.querySelector('input').value) || 0;
      shares[name] = val;
      total += val;
    });
    if (Math.abs(total - amount) > 0.01) return alert("Split doesn't match amount!");
  }

  const splitRef = doc(db, "splits", splitTitle);
  const splitSnap = await getDoc(splitRef);
  const data = splitSnap.data();

  if (!splitSnap.exists()) {
    await setDoc(splitRef, { expenses: [] });
  }

  const newExpenses = [...(data?.expenses || []), { payer, amount, shares }];
  await updateDoc(splitRef, { expenses: newExpenses });
  document.getElementById('amount').value = "";
  if (document.getElementById('splitType').value === "custom") {
    document.querySelectorAll('#customSplit input').forEach(i => i.value = "");
  }
}

function renderSummary(data) {
  const balance = {};
  people.forEach(p => balance[p] = 0);
  data.forEach(e => {
    for (let p of people) balance[p] -= e.shares[p] || 0;
    balance[e.payer] += e.amount;
  });

  const creditors = people.filter(p => balance[p] > 0).sort((a,b) => balance[b] - balance[a]);
  const debtors = people.filter(p => balance[p] < 0).sort((a,b) => balance[a] - balance[b]);

  const summary = [];
  while (creditors.length && debtors.length) {
    let c = creditors[0], d = debtors[0];
    const pay = Math.min(balance[c], -balance[d]);
    summary.push(`${d} pays ${c} ₹${pay.toFixed(2)}`);
    balance[c] -= pay;
    balance[d] += pay;
    if (balance[c] < 0.01) creditors.shift();
    if (balance[d] > -0.01) debtors.shift();
  }
  document.getElementById('summary').innerHTML = summary.join('<br>');
}

function toggleCustomSplit() {
  const type = document.getElementById('splitType').value;
  document.getElementById('customSplit').style.display = type === 'custom' ? 'block' : 'none';
}

// Live sync listener
window.addEventListener('DOMContentLoaded', () => {
  const splitTitle = localStorage.getItem('currentSplit');
  if (document.getElementById('splitTitle'))
    document.getElementById('splitTitle').textContent = splitTitle;
  const splitRef = doc(db, "splits", splitTitle);
  onSnapshot(splitRef, (docSnap) => {
    const data = docSnap.data();
    if (data?.expenses) renderSummary(data.expenses);
  });
});

export { addExpense, toggleCustomSplit };
