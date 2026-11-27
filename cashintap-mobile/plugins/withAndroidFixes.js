const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

const withFixedAppBuildGradle = (config) => {
  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    contents = contents.replace('apply plugin: "org.jetbrains.kotlin.android"\n', '');
    contents = contents.replace(
      'ndkVersion rootProject.ext.ndkVersion',
      'ndkVersion "30.0.16248370"'
    );
    contents = contents.replace(
      "    enableBundleCompression = (findProperty('android.enableBundleCompression') ?: false).toBoolean()\n",
      ''
    );
    mod.modResults.contents = contents;
    return mod;
  });
};

const withFixedRootBuildGradle = (config) => {
  return withProjectBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    // Pin Kotlin to 2.2.0 to match Gradle 9.4.1's embedded Kotlin, avoiding KotlinTopLevelExtension conflict
    contents = contents.replace(
      /def kotlinVersion = findProperty\('android\.kotlinVersion'\)\s*\n\s*classpath\(kotlinVersion \? "org\.jetbrains\.kotlin:kotlin-gradle-plugin:\$kotlinVersion" : 'org\.jetbrains\.kotlin:kotlin-gradle-plugin'\)/,
      "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.0')"
    );
    mod.modResults.contents = contents;
    return mod;
  });
};

module.exports = (config) => {
  config = withFixedAppBuildGradle(config);
  config = withFixedRootBuildGradle(config);
  return config;
};
