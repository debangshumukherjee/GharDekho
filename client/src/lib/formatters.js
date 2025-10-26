// A utility function to format date strings into "DD/MM/YYYY HH:MM AM/PM"
export const formatTimestamp = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  // Get date components
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
  const year = date.getFullYear();

  // Get time components
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // The hour '0' should be '12'
  const paddedHours = String(hours).padStart(2, "0");

  return `${day}/${month}/${year} ${paddedHours}:${minutes} ${ampm}`;
};
