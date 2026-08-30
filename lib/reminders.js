function parseDuration(input) {
  const match = input.match(/^(
\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)$/i);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  let ms;
  if (unit.startsWith('s')) ms = amount * 1000;
  else if (unit.startsWith('m')) ms = amount * 60 * 1000;
  else if (unit.startsWith('h')) ms = amount * 60 * 60 * 1000;
  else if (unit.startsWith('d')) ms = amount * 24 * 60 * 60 * 1000;
  else return null;

  return ms;
}

module.exports = { parseDuration };