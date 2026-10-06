"use strict";

const MAX_ORDERS = 100;
const orderForm = document.querySelector("#order-form");
const orderInput = document.querySelector("#order-input");
const orderCount = document.querySelector("#order-count");
const trimSpaces = document.querySelector("#trim-spaces");
const damagedOrder = document.querySelector("#damaged-order");
const clearButton = document.querySelector("#clear-button");
const printButton = document.querySelector("#print-button");
const formMessage = document.querySelector("#form-message");
const resultsSection = document.querySelector("#results-section");
const resultsCount = document.querySelector("#results-count");
const qrGrid = document.querySelector("#qr-grid");

function getOrderLines() {
  return orderInput.value.split(/\r?\n/).filter((line) => line.trim() !== "");
}

function normalizeOrder(line) {
  if (!trimSpaces.checked) {
    return line;
  }

  return line.trim().replace(/\s+/g, " ");
}

function updateOrderCount() {
  const count = getOrderLines().length;
  orderCount.textContent = `${count} / ${MAX_ORDERS}`;
  orderCount.classList.toggle("count-error", count > MAX_ORDERS);
}

function showError(message) {
  formMessage.textContent = message;
}

function createQrCard(orderNumber, isDamaged) {
  const card = document.createElement("article");
  card.className = "qr-card";

  const qrContainer = document.createElement("div");
  qrContainer.className = "qr-code";
  qrContainer.setAttribute("role", "img");
  qrContainer.setAttribute("aria-label", `QR-код заказа ${orderNumber}`);

  const number = document.createElement("div");
  number.className = "qr-order-number";
  number.textContent = orderNumber;

  card.append(qrContainer, number);

  if (isDamaged) {
    const badge = document.createElement("span");
    badge.className = "damaged-badge";
    badge.textContent = "Повреждённый заказ";
    card.append(badge);
  }

  new QRCode(qrContainer, {
    text: orderNumber,
    width: 160,
    height: 160,
    colorDark: "#111827",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });

  return card;
}

orderInput.addEventListener("input", updateOrderCount);

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const rawLines = getOrderLines();
  if (rawLines.length === 0) {
    showError("Добавьте хотя бы один номер заказа.");
    orderInput.focus();
    return;
  }

  if (rawLines.length > MAX_ORDERS) {
    showError(`Можно создать не более ${MAX_ORDERS} QR-кодов за один раз.`);
    orderInput.focus();
    return;
  }

  if (typeof QRCode === "undefined") {
    showError("Не удалось загрузить генератор QR-кодов. Проверьте подключение к интернету и обновите страницу.");
    return;
  }

  const orders = rawLines.map(normalizeOrder);
  if (orders.some((order) => order.length === 0)) {
    showError("После удаления пробелов остался пустой номер. Проверьте введённые данные.");
    return;
  }

  const fragment = document.createDocumentFragment();
  try {
    for (const order of orders) {
      fragment.append(createQrCard(order, damagedOrder.checked));
    }
  } catch (error) {
    console.error("Не удалось создать QR-коды:", error);
    showError("Не удалось создать QR-код для одного из номеров. Проверьте номера и попробуйте ещё раз.");
    return;
  }

  qrGrid.replaceChildren(fragment);
  resultsCount.textContent = `(${orders.length})`;
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

clearButton.addEventListener("click", () => {
  orderInput.value = "";
  qrGrid.replaceChildren();
  resultsSection.hidden = true;
  resultsCount.textContent = "";
  formMessage.textContent = "";
  updateOrderCount();
  orderInput.focus();
});

printButton.addEventListener("click", () => {
  if (qrGrid.childElementCount === 0) {
    showError("Сначала создайте QR-коды для печати.");
    return;
  }

  window.print();
});

updateOrderCount();
