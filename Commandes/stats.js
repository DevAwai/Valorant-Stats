const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { API } = require("vandal.js");
const cooldowns = new Map();

const rankTranslations = {
    "iron": "Fer",
    "bronze": "Bronze",
    "silver": "Argent",
    "gold": "Or",
    "platinum": "Platine",
    "diamond": "Diamant",
    "ascendant": "Ascendant",
    "immortal": "Immortel",
    "radiant": "Radiant"
};

const rankColors = {
    "fer": "#9F9F9F",
    "bronze": "#CD7F32",
    "argent": "#C0C0C0",
    "or": "#FFD700",
    "platine": "#00FFFF",
    "diamant": "#00BFFF",
    "ascendant": "#4B0082",
    "immortel": "#DC143C",
    "radiant": "#FFFF00"
};

module.exports = {
    name: "stats",
    description: "Affiche les statistiques d'un joueur Valorant",
    permissions: "Aucune",
    dm: false,
    cooldown: 10,
    options: [
        {
            type: "string",
            name: "pseudo",
            description: "Le pseudo sous format Pseudo#Tag",
            required: true
        }
    ],

    async execute(interaction) {
        const userId = interaction.user.id;
        const cooldownTime = this.cooldown * 1000;

        if (cooldowns.has(userId)) {
            const remainingTime = cooldowns.get(userId) - Date.now();
            if (remainingTime > 0) {
                return interaction.reply({
                    content: `⏳ **Fils De Pute !** Attends ${(remainingTime / 1000).toFixed(1)} seconde(s) avant de refaire !`,
                    ephemeral: true
                });
            }
        }

        cooldowns.set(userId, Date.now() + cooldownTime);

        setTimeout(() => cooldowns.delete(userId), cooldownTime);

        const pseudo = interaction.options.getString("pseudo");

        if (!pseudo.match(/^.+#[0-9A-Za-z]{3,5}$/)) {
            return interaction.reply({
                content: "❌ **Format invalide !**\nUtilise : `Pseudo#Tag` (exemple : `Player#1234`)",
                ephemeral: true
            });
        }

        if (pseudo.toLowerCase() === "moraisn#3025") {
            const trollEmbed = new EmbedBuilder()
                .setTitle("🚫 Pas besoin de vérifier !")
                .setColor("Red")
                .setDescription("Tout le monde sait que **Moraisn#3025** est nul... 😂")
                .setImage("https://media.tenor.com/UllMEu4hWl4AAAAM/clown.gif")
                .setFooter({ text: "Allez, retourne t'entraîner fdp." });

            return interaction.reply({
                embeds: [trollEmbed],
                ephemeral: false
            });
        }

        const [gameName, tagLine] = pseudo.split("#");

        try {
            // Récupérer les données de l'utilisateur via l'API
            const user = await API.fetchUser(gameName, tagLine);
            console.log("API Response (Raw):", user?._raw || "No raw data");
        
            if (!user) {
                return interaction.editReply({
                    content: "❌ **Joueur introuvable !**\nVérifie que le pseudo et le tag sont corrects.",
                    ephemeral: true
                });
            }
        
            // Extraire les informations de l'utilisateur
            const userInfo = user.info();
            const rankedStats = user.ranked() || {};
            const unrankedStats = user.unrated() || {};
            const generalStats = user.gamemodes() || {};
        
            console.log("General Stats:", generalStats); // Afficher la structure des données
        
            // Données pour l'embed
            const avatarURL = userInfo.avatar || "https://example.com/default-avatar.png";
            const bannerURL = userInfo.card || "https://media.valorant-api.com/playercards/99fbf62b-4dbe-4edb-b4dc-89b4a56df7aa.png";
            const rank = userInfo.rank || "Non classé";
            const peakRank = userInfo.peakRank || "Inconnu";
            const rankedKD = rankedStats.kDRatio ? rankedStats.kDRatio.toFixed(2) : "0.00";
            const rankedKills = rankedStats.kills || 0;
            const rankedHeadshots = rankedStats.headshotsPercentage ? `${rankedStats.headshotsPercentage.toFixed(2)}%` : "0%";
        
            // Calculer les kills totaux
            let totalKills = 0;
            let killsFound = false;
        
            // Parcourir les modes de jeu pour additionner les kills
            for (const mode in generalStats) {
                if (generalStats[mode]?.kills) {
                    totalKills += generalStats[mode].kills;
                    killsFound = true;
                }
            }
        
            // Si aucun kill n'est trouvé, afficher "Inconnu"
            if (!killsFound) {
                totalKills = "Inconnu";
            }
        
            const rankedPlayed = rankedStats.matchesPlayed ? Number(rankedStats.matchesPlayed) : 0;
            const unrankedPlayed = unrankedStats.matchesPlayed ? Number(unrankedStats.matchesPlayed) : 0;
            const totalPlayed = rankedPlayed + unrankedPlayed || "Inconnu";
        
            // Nettoyer et formater le rang
            const cleanRank = rank.toLowerCase().replace(/[^a-z]/g, ""); // Supprime les chiffres et espaces
        
            // Trouver la couleur correspondante
            let embedColor = "Blue"; // Couleur par défaut
            for (const key in rankColors) {
                if (cleanRank.includes(key)) {
                    embedColor = rankColors[key];
                    break;
                }
            }
        
            // Créer l'embed
            const embed = new EmbedBuilder()
                .setTitle(`📊 Valorant Stats - ${gameName}#${tagLine}`)
                .setColor(embedColor)
                .setThumbnail(avatarURL)
                .setImage(bannerURL)
                .addFields(
                    { name: "🏆 Rang Actuel", value: `**${rank}**`, inline: true },
                    { name: "🚀 Peak Rank", value: `**${peakRank}**`, inline: true }
                )
                .addFields(
                    { name: "🔫 K/D Ratio (Ranked)", value: `**${rankedKD}**`, inline: true },
                    { name: "💀 Kills (Ranked)", value: `**${rankedKills}**`, inline: true },
                    { name: "🎯 Headshot % (Ranked)", value: `**${rankedHeadshots}**`, inline: true }
                )
                .addFields(
                    { name: "🎮 Parties Jouées (Total)", value: `**${totalPlayed}**`, inline: true },
                    { name: "💀 Kills (Total)", value: `**${totalKills}**`, inline: true }
                )
                .setTimestamp();
        
            // Envoyer l'embed
            await interaction.editReply({
                content: "🎯 Voici les statistiques du joueur :",
                embeds: [embed]
            });
        } catch (dataError) {
            console.error("❌ Erreur lors du traitement des données :", dataError);
        
            const errorEmbed = new EmbedBuilder()
                .setTitle("⚠️ Erreur lors du traitement des données")
                .setColor("Red")
                .setDescription(
                    `\`\`\`js\n${dataError.stack?.slice(0, 1000) || dataError.message}\n\`\`\``
                )
                .setFooter({ text: "Si le problème persiste, contacte un administrateur." });
        
            await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};