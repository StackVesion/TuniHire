module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ajouter une règle pour les fichiers de police
      webpackConfig.module.rules.push({
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name].[hash][ext]',
        },
      });

      return webpackConfig;
    },
  },
};
