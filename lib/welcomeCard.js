const { createCanvas, loadImage } = require('@napi-rs/canvas');

async function generateWelcomeCard(member) {
  const canvas = createCanvas(1000, 350);
  const ctx = canvas.getContext('2d');

  // Dark background gradient: near-black at top fading to slightly lighter at bottom
  const gradient = ctx.createLinearGradient(0, 0, 0, 350);
  gradient.addColorStop(0, 'rgb(10, 8, 9)');
  gradient.addColorStop(1, 'rgb(25, 20, 22)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1000, 350);

  // Soft red radial glow in bottom-left using layered semi-transparent circles
  const glowCenterX = 100;
  const glowCenterY = 300;
  const glowColor = [178, 34, 34]; // Red

  // Draw concentric circles with decreasing opacity for glow effect
  for (let i = 200; i > 0; i -= 20) {
    const opacity = (1 - i / 200) * 0.3; // Fade from 0.3 to 0
    ctx.fillStyle = `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${opacity})`;
    ctx.beginPath();
    ctx.arc(glowCenterX, glowCenterY, i, 0, Math.PI * 2);
    ctx.fill();
  }

  // Load and draw member avatar as circular image
  let avatarImage = null;
  try {
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    avatarImage = await loadImage(avatarUrl);
  } catch (err) {
    console.warn('Could not load member avatar:', err.message);
  }

  const avatarX = 90;
  const avatarY = 175; // Vertically centered
  const avatarRadius = 80;

  // Draw circular avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
  ctx.clip();
  if (avatarImage) {
    ctx.drawImage(avatarImage, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
  } else {
    // Fallback: draw a placeholder circle if avatar failed to load
    ctx.fillStyle = 'rgb(80, 80, 80)';
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Draw red ring around avatar
  ctx.strokeStyle = 'rgb(178, 34, 34)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 6, 0, Math.PI * 2);
  ctx.stroke();

  // Draw text to the right of avatar
  const textStartX = 250;

  // "WELCOME" title
  ctx.font = 'bold 52px Arial, sans-serif';
  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.textBaseline = 'top';
  ctx.fillText('WELCOME', textStartX, 105);

  // Member username
  ctx.font = '28px Arial, sans-serif';
  ctx.fillStyle = 'rgb(196, 60, 60)';
  ctx.fillText(member.user.username, textStartX, 165);

  // "to {guild name}"
  ctx.font = '22px Arial, sans-serif';
  ctx.fillStyle = 'rgb(150, 150, 155)';
  ctx.fillText(`to ${member.guild.name}`, textStartX, 205);

  // Draw rounded-rectangle badge in bottom-right corner with red outline
  const badgeX = 740;
  const badgeY = 280;
  const badgeWidth = 230;
  const badgeHeight = 50;
  const badgeRadius = 10;

  ctx.strokeStyle = 'rgb(178, 34, 34)';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(178, 34, 34, 0.1)';

  // Rounded rectangle path
  ctx.beginPath();
  ctx.moveTo(badgeX + badgeRadius, badgeY);
  ctx.lineTo(badgeX + badgeWidth - badgeRadius, badgeY);
  ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + badgeRadius);
  ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - badgeRadius);
  ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - badgeRadius, badgeY + badgeHeight);
  ctx.lineTo(badgeX + badgeRadius, badgeY + badgeHeight);
  ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - badgeRadius);
  ctx.lineTo(badgeX, badgeY + badgeRadius);
  ctx.quadraticCurveTo(badgeX, badgeY, badgeX + badgeRadius, badgeY);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();

  // Badge text: "MEMBER #{memberCount}"
  const badgeText = `MEMBER #${member.guild.memberCount}`;
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillStyle = 'rgb(178, 34, 34)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);

  // Return canvas as PNG Buffer
  return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeCard };
