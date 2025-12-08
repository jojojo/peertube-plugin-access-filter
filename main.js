const PLUGIN_NAME = 'peertube-plugin-access-filter'

async function register ({
  registerHook,
  peertubeHelpers
}) {
  const logger = peertubeHelpers.logger
  const settings = peertubeHelpers.pluginSettingsManager

  //
  // HOOK SUR STREAMING
  //
  registerHook({
    target: 'action:api.video.streaming.get',
    handler: async ({ req, res, next }) => {
      try {

        // Charger les settings du plugin
        const rawIps = await settings.getSetting(PLUGIN_NAME, 'allowedIps') || ''
        const rawRefs = await settings.getSetting(PLUGIN_NAME, 'allowedReferers') || ''

        const allowedIps = rawIps
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

        const allowedRefs = rawRefs
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

        // Infos requête
        const ip =
          req.headers['x-forwarded-for']?.split(',')[0].trim() ||
          req.connection?.remoteAddress ||
          req.ip ||
          ''

        const referer = req.headers.referer || ''

        // Si pas de règles définies, on laisse passer
        if (allowedIps.length === 0 && allowedRefs.length === 0) {
          return next()
        }

        // Autoriser IP
        if (allowedIps.some(a => ip.startsWith(a))) {
          return next()
        }

        // Autoriser referer iframe
        if (allowedRefs.some(r => referer.startsWith(r))) {
          return next()
        }

        // Blocage
        logger.info(`[${PLUGIN_NAME}] Access denied: ip=${ip}, referer=${referer}`)
        res.statusCode = 403
        res.end('Forbidden')

      } catch (err) {
        logger.error(`[${PLUGIN_NAME}] Error: ${err}`)
        return next()
      }
    }
  })

  logger.info(`[${PLUGIN_NAME}] Plugin loaded`)
}

async function unregister () {
  // Aucun cleanup nécessaire
}

module.exports = {
  register,
  unregister
}