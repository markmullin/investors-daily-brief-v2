const getWebSocketServer = (server) => {
  const wss = {
    path: '/ws',
    server,
    clientTracking: true,
    maxPayload: 1024 * 1024, // 1MB
    handleProtocols: (protocols) => {
      if (protocols.includes('market-data')) {
        return 'market-data';
      }
      return '';
    }
  };
  return wss;
};

export default getWebSocketServer;