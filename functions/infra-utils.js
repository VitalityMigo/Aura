const { accessSql, profileData } = require('../events/database');

async function authPrivacyMulti(authorId, subcommand, privateOnly) {

    try {

        //Récupère régagle de privé/ou pas de l'utilisateur
        const profile = await profileData.findOne({ where: { authorId: authorId } })

        const isPrivate = privateOnly.includes(subcommand)
        const defaultPrv = false

        if (profile) {
            // Le user a un profile

            // On récupère les param de privacy
            const privacy = profile.dataValues.privacyMode

            if (privacy === 'public' && !isPrivate) {

                return false

            } else {

                return true
            }

        } else {

            if (isPrivate) {

                return true

            } else {

                return defaultPrv

            }
        }

    } catch (error) {
        console.log(error.stack)

        return false
    }
}

async function authPrivacy(authorId) {

    try {

        //Récupère régagle de privé/ou pas de l'utilisateur
        const profile = await profileData.findOne({ where: { authorId: authorId } })

        const defaultPrv = false

        if (profile) {
            // Le user a un profile

            // On récupère les param de privacy
            const privacy = profile.dataValues.privacyMode

            if (privacy === 'public') {

                return false

            } else {

                return true
            }

        } else {

            return defaultPrv

        }

    } catch (error) {
        console.log(error.stack)

        return false
    }

}

async function communityInfos(serverId) {

    const community = await accessSql.findOne({ where: { serverId: serverId } })

    const result = {
        member: null,
        admin: null,
        tier: null,
        statut: false,
    }

    if (community) {

        result.member = community.dataValues.memberRoleId
        result.admin = community.dataValues.adminRoleId
        result.tier = community.dataValues.accessTier.toLowerCase()

        if (community.dataValues.statut.toLowerCase() === 'active') {
            result.statut = true
        }
    }

    return result
}

// Cette fonction peut être adapter si la DB contient 
// le level d'accès de chaque commande et sous commandes
// Permet de mesure le use de chaque commande (potentiellement)
function freeAccess(subcommand, excluded) {

    if (excluded.includes(subcommand)) {
        return true
    } else {
        return false
    }

}


module.exports = {
    authPrivacyMulti,
    authPrivacy,
    communityInfos,
    freeAccess
}