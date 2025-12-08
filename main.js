// peertube-plugin-access-filter
// Plugin PeerTube : restriction d'accès par IP et/ou referer

const PLUGIN_NAME = 'peertube-plugin-access-filter'

async function register (options) {
  const {
    registerHook,
    registerSetting,
    peertubeHelpers
  } = options

  const logger = peertubeHelpers.logger
  const settingsManager = peertubeHelpers.pluginSettingsManager

  //
  // 1) Déclaration des paramètres dans l'UI d'admin PeerTube
  //
  await registerSetting({
    name: 'allowedIps',
    label: 'Authorized IPs (comma-separated)',
    type: 'string',
    private: true,
    description: 'Example: 10.0.0.1, 192.168.0.0/24'
  })

  await registerSetting({
    name: 'allowedReferers',
    label: 'Authorized referrer domains (comma-separated)',
    type: 'string',
    private: true,
    description: 'Example: https://www.airmes-application.eu, https://app.airmes-application.eu'
  })

  //
  // 2) Hook sur le streaming vidéo
  //    - .m3u8 / .ts / .mp4 etc.
  //
  registerHook({
    target: 'action:api.video.streaming.get',
    handler: async ({ req, res, next }) => {
      try {
        // Récupérer la config de plugin
        const rawIps = (await settingsManager.getSetting(PLUGIN_NAME, 'allowedIps')) || ''
        const rawRefs = (await settingsManager.getSetting(PLUGIN_NAME, 'allowedReferers')) || ''

        const allowedIps = rawIps
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

        const allowedRefs = rawRefs
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

        const ip =
          req.headers['x-forwarded-for']?.split(',')[0].trim() ||
          req.connection?.remoteAddress ||
          req.ip ||
          ''

        const referer = req.headers.referer || ''

        // Si aucune règle n'est définie, on laisse tout passer (fail-open pour éviter de tout casser par défaut)
        if (allowedIps.length === 0 && allowedRefs.length === 0) {
          return next()
        }

        // 1) Vérification IP
        if (allowedIps.length > 0) {
          const ipOk = allowedIps.some(allowed => {
            // match simple : début identique (10.0.0. / 192.168.), IP exacte, etc.
            return ip.startsWith(allowed)
          })

          if (ipOk) {
            return next()
          }
        }

        // 2) Vérification Referer
        if (allowedRefs.length > 0) {
          const refOk = allowedRefs.some(allowedDomain => {
            return referer.startsWith(allowedDomain)
          })

          if (refOk) {
            return next()
          }
        }

        // Si ni IP ni ref ne matchent → blocage
        logger.info(`[${PLUGIN_NAME}] Blocked access. IP=${ip}, referer=${referer}`)
        res.statusCode = 403
        return res.end('Forbidden')

      } catch (err) {
        logger.error(`[${PLUGIN_NAME}] Error in access filter: ${err && err.message}`)
        // En cas d'erreur, on laisse passer pour ne pas casser le site
        return next()
      }
    }
  })

  logger.info(`[${PLUGIN_NAME}] Registered access filter plugin`)
}

async function unregister () {
  // Rien de spécifique à nettoyer
}

module.exports = {
  register,
  unregister
}