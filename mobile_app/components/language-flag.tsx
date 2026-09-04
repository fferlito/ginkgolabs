import { Image, View } from "react-native";

const FLAGS: Record<string, number> = {
  al: require("../assets/flags/al.png"),
  ba: require("../assets/flags/ba.png"),
  bg: require("../assets/flags/bg.png"),
  by: require("../assets/flags/by.png"),
  ch: require("../assets/flags/ch.png"),
  cz: require("../assets/flags/cz.png"),
  de: require("../assets/flags/de.png"),
  dk: require("../assets/flags/dk.png"),
  ee: require("../assets/flags/ee.png"),
  es: require("../assets/flags/es.png"),
  fi: require("../assets/flags/fi.png"),
  fo: require("../assets/flags/fo.png"),
  fr: require("../assets/flags/fr.png"),
  gb: require("../assets/flags/gb.png"),
  "gb-sct": require("../assets/flags/gb-sct.png"),
  "gb-wls": require("../assets/flags/gb-wls.png"),
  gr: require("../assets/flags/gr.png"),
  hr: require("../assets/flags/hr.png"),
  hu: require("../assets/flags/hu.png"),
  ie: require("../assets/flags/ie.png"),
  is: require("../assets/flags/is.png"),
  it: require("../assets/flags/it.png"),
  lt: require("../assets/flags/lt.png"),
  lu: require("../assets/flags/lu.png"),
  lv: require("../assets/flags/lv.png"),
  mk: require("../assets/flags/mk.png"),
  mt: require("../assets/flags/mt.png"),
  nl: require("../assets/flags/nl.png"),
  no: require("../assets/flags/no.png"),
  pl: require("../assets/flags/pl.png"),
  pt: require("../assets/flags/pt.png"),
  ro: require("../assets/flags/ro.png"),
  rs: require("../assets/flags/rs.png"),
  ru: require("../assets/flags/ru.png"),
  se: require("../assets/flags/se.png"),
  si: require("../assets/flags/si.png"),
  sk: require("../assets/flags/sk.png"),
  tr: require("../assets/flags/tr.png"),
  ua: require("../assets/flags/ua.png"),
};

export function LanguageFlag({ flag }: { flag: string }) {
  const source = FLAGS[flag];
  if (!source) return <View style={{ width: 28, height: 20 }} />;
  return (
    <Image
      source={source}
      accessibilityIgnoresInvertColors
      style={{
        width: 28,
        height: 20,
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: "rgba(245,245,240,0.25)",
      }}
    />
  );
}
