const overlay = document.getElementById("overlay")!;
const priority = document.getElementById("priority")!;
const title = document.getElementById("title")!;
const message = document.getElementById("message")!;

window.coach.onRecommendation((rec) => {
  if (!rec) {
    overlay.style.display = "none";
    return;
  }
  priority.textContent = rec.priority.toUpperCase();
  title.textContent = rec.title;
  message.textContent = rec.message;
  overlay.style.display = "flex";
});