/** Realistic messy supplier messages + a sample client inquiry for the demo script. */

export const SAMPLE_SUPPLIER_MESSAGES: { label: string; text: string }[] = [
  {
    label: "Al-Haramain Travels (WhatsApp)",
    text: `Aslam o alaikum sir\nSwissotel makkah 23 to 27 dec\nDBL 1407 sar/night incl breakfast, only 6 rooms\ntriple 1800 also avail\nrates net, confirm fast peak season`,
  },
  {
    label: "Makkah Gateway DMC (WhatsApp)",
    text: `Pullman zamzam mkh 23-27/12\ndouble 1348 BB\nconrad makkah same dates 1280 room only\nboth limited availability`,
  },
  {
    label: "Barakah Reservations (WhatsApp)",
    text: `Hilton suites makkah\n23dec-27dec double w/ breakfast SAR 1145\n12 rooms left\nprices subject to change`,
  },
  {
    label: "Safa Hotels Network (mixed)",
    text: `Dar al tawhid intercon 23/12 to 27/12\nDBL 1474 net incl bf\nswissotel double 1522 dinner+bf\navailability tight`,
  },
];

export const SAMPLE_INQUIRY_TEXT =
  "Assalamu alaikum, I need a hotel in Makkah close to the Haram for 3 people, double room, " +
  "checking in 23 December and out on the 27th. What are the best options and prices?";

/** Deliberately incomplete — triggers the conversational follow-up loop. */
export const SAMPLE_INQUIRY_VAGUE =
  "Salam, I'm planning Umrah and need a hotel in Makkah. What do you have?";

/** A short transcript stand-in if no audio is uploaded (used to label the voice demo). */
export const SAMPLE_VOICE_HINT =
  "Tip: upload any short audio file (mp3/m4a/wav). The demo transcribes it with Whisper, " +
  "then parses it into a structured request.";
