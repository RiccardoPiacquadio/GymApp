export const toIsoNow = () => new Date().toISOString();

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium"
  }).format(new Date(value));

export const daysAgoIso = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};
