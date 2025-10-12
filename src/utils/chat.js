export const parseTellCommand = (message, master, botName) => {
  const tellRegex = /^\s*\/tell\s+(\S+)\s+(.+)$/i;
  const match = tellRegex.exec(message);
  if (!match) return null;
  const [ , target, remainder ] = match;
  if (target.toLowerCase() !== botName.toLowerCase()) return null;
  return {
    sender: master,
    commandText: remainder.trim()
  };
};

export const parseWhisper = ({ sender, message }, master, botName) => {
  if (sender.toLowerCase() !== master.toLowerCase()) return null;
  const clean = message.trim();
  if (!clean.toLowerCase().startsWith(`/tell ${botName.toLowerCase()}`)) return null;
  const command = clean.replace(/^\s*\/tell\s+\S+\s+/i, '');
  return command.trim();
};

export const buildWhisper = (player, text) => `/tell ${player} ${text}`;
