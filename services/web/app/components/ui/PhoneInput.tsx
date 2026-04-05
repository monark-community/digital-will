"use client";

import { useState, useEffect, useRef } from "react";

interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dialCode: string;
}

/** Converts an ISO 3166-1 alpha-2 code to its flag emoji. */
function getFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

export const COUNTRIES: Country[] = [
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "AF", name: "Afghanistan", dialCode: "+93" },
  { code: "AX", name: "Aland Islands", dialCode: "+358" },
  { code: "AL", name: "Albania", dialCode: "+355" },
  { code: "DZ", name: "Algeria", dialCode: "+213" },
  { code: "AS", name: "American Samoa", dialCode: "+1684" },
  { code: "AD", name: "Andorra", dialCode: "+376" },
  { code: "AO", name: "Angola", dialCode: "+244" },
  { code: "AI", name: "Anguilla", dialCode: "+1264" },
  { code: "AQ", name: "Antarctica", dialCode: "+672" },
  { code: "AG", name: "Antigua and Barbuda", dialCode: "+1268" },
  { code: "AR", name: "Argentina", dialCode: "+54" },
  { code: "AM", name: "Armenia", dialCode: "+374" },
  { code: "AW", name: "Aruba", dialCode: "+297" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "AT", name: "Austria", dialCode: "+43" },
  { code: "AZ", name: "Azerbaijan", dialCode: "+994" },
  { code: "BS", name: "Bahamas", dialCode: "+1242" },
  { code: "BH", name: "Bahrain", dialCode: "+973" },
  { code: "BD", name: "Bangladesh", dialCode: "+880" },
  { code: "BB", name: "Barbados", dialCode: "+1246" },
  { code: "BY", name: "Belarus", dialCode: "+375" },
  { code: "BE", name: "Belgium", dialCode: "+32" },
  { code: "BZ", name: "Belize", dialCode: "+501" },
  { code: "BJ", name: "Benin", dialCode: "+229" },
  { code: "BM", name: "Bermuda", dialCode: "+1441" },
  { code: "BT", name: "Bhutan", dialCode: "+975" },
  { code: "BO", name: "Bolivia", dialCode: "+591" },
  { code: "BA", name: "Bosnia and Herzegovina", dialCode: "+387" },
  { code: "BW", name: "Botswana", dialCode: "+267" },
  { code: "BR", name: "Brazil", dialCode: "+55" },
  { code: "IO", name: "British Indian Ocean Territory", dialCode: "+246" },
  { code: "BN", name: "Brunei Darussalam", dialCode: "+673" },
  { code: "BG", name: "Bulgaria", dialCode: "+359" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226" },
  { code: "BI", name: "Burundi", dialCode: "+257" },
  { code: "KH", name: "Cambodia", dialCode: "+855" },
  { code: "CM", name: "Cameroon", dialCode: "+237" },
  { code: "CV", name: "Cape Verde", dialCode: "+238" },
  { code: "KY", name: "Cayman Islands", dialCode: "+345" },
  { code: "CF", name: "Central African Republic", dialCode: "+236" },
  { code: "TD", name: "Chad", dialCode: "+235" },
  { code: "CL", name: "Chile", dialCode: "+56" },
  { code: "CN", name: "China", dialCode: "+86" },
  { code: "CX", name: "Christmas Island", dialCode: "+61" },
  { code: "CC", name: "Cocos (Keeling) Islands", dialCode: "+61" },
  { code: "CO", name: "Colombia", dialCode: "+57" },
  { code: "KM", name: "Comoros", dialCode: "+269" },
  { code: "CG", name: "Congo", dialCode: "+242" },
  { code: "CD", name: "Congo, DR", dialCode: "+243" },
  { code: "CK", name: "Cook Islands", dialCode: "+682" },
  { code: "CR", name: "Costa Rica", dialCode: "+506" },
  { code: "CI", name: "Cote d'Ivoire", dialCode: "+225" },
  { code: "HR", name: "Croatia", dialCode: "+385" },
  { code: "CU", name: "Cuba", dialCode: "+53" },
  { code: "CY", name: "Cyprus", dialCode: "+357" },
  { code: "CZ", name: "Czech Republic", dialCode: "+420" },
  { code: "DK", name: "Denmark", dialCode: "+45" },
  { code: "DJ", name: "Djibouti", dialCode: "+253" },
  { code: "DM", name: "Dominica", dialCode: "+1767" },
  { code: "DO", name: "Dominican Republic", dialCode: "+1849" },
  { code: "EC", name: "Ecuador", dialCode: "+593" },
  { code: "EG", name: "Egypt", dialCode: "+20" },
  { code: "SV", name: "El Salvador", dialCode: "+503" },
  { code: "GQ", name: "Equatorial Guinea", dialCode: "+240" },
  { code: "ER", name: "Eritrea", dialCode: "+291" },
  { code: "EE", name: "Estonia", dialCode: "+372" },
  { code: "ET", name: "Ethiopia", dialCode: "+251" },
  { code: "FK", name: "Falkland Islands", dialCode: "+500" },
  { code: "FO", name: "Faroe Islands", dialCode: "+298" },
  { code: "FJ", name: "Fiji", dialCode: "+679" },
  { code: "FI", name: "Finland", dialCode: "+358" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "GF", name: "French Guiana", dialCode: "+594" },
  { code: "PF", name: "French Polynesia", dialCode: "+689" },
  { code: "GA", name: "Gabon", dialCode: "+241" },
  { code: "GM", name: "Gambia", dialCode: "+220" },
  { code: "GE", name: "Georgia", dialCode: "+995" },
  { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "GH", name: "Ghana", dialCode: "+233" },
  { code: "GI", name: "Gibraltar", dialCode: "+350" },
  { code: "GR", name: "Greece", dialCode: "+30" },
  { code: "GL", name: "Greenland", dialCode: "+299" },
  { code: "GD", name: "Grenada", dialCode: "+1473" },
  { code: "GP", name: "Guadeloupe", dialCode: "+590" },
  { code: "GU", name: "Guam", dialCode: "+1671" },
  { code: "GT", name: "Guatemala", dialCode: "+502" },
  { code: "GG", name: "Guernsey", dialCode: "+44" },
  { code: "GN", name: "Guinea", dialCode: "+224" },
  { code: "GW", name: "Guinea-Bissau", dialCode: "+245" },
  { code: "GY", name: "Guyana", dialCode: "+595" },
  { code: "HT", name: "Haiti", dialCode: "+509" },
  { code: "VA", name: "Holy See (Vatican)", dialCode: "+379" },
  { code: "HN", name: "Honduras", dialCode: "+504" },
  { code: "HK", name: "Hong Kong", dialCode: "+852" },
  { code: "HU", name: "Hungary", dialCode: "+36" },
  { code: "IS", name: "Iceland", dialCode: "+354" },
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "ID", name: "Indonesia", dialCode: "+62" },
  { code: "IR", name: "Iran", dialCode: "+98" },
  { code: "IQ", name: "Iraq", dialCode: "+964" },
  { code: "IE", name: "Ireland", dialCode: "+353" },
  { code: "IM", name: "Isle of Man", dialCode: "+44" },
  { code: "IL", name: "Israel", dialCode: "+972" },
  { code: "IT", name: "Italy", dialCode: "+39" },
  { code: "JM", name: "Jamaica", dialCode: "+1876" },
  { code: "JP", name: "Japan", dialCode: "+81" },
  { code: "JE", name: "Jersey", dialCode: "+44" },
  { code: "JO", name: "Jordan", dialCode: "+962" },
  { code: "KZ", name: "Kazakhstan", dialCode: "+77" },
  { code: "KE", name: "Kenya", dialCode: "+254" },
  { code: "KI", name: "Kiribati", dialCode: "+686" },
  { code: "KP", name: "North Korea", dialCode: "+850" },
  { code: "KR", name: "South Korea", dialCode: "+82" },
  { code: "KW", name: "Kuwait", dialCode: "+965" },
  { code: "KG", name: "Kyrgyzstan", dialCode: "+996" },
  { code: "LA", name: "Laos", dialCode: "+856" },
  { code: "LV", name: "Latvia", dialCode: "+371" },
  { code: "LB", name: "Lebanon", dialCode: "+961" },
  { code: "LS", name: "Lesotho", dialCode: "+266" },
  { code: "LR", name: "Liberia", dialCode: "+231" },
  { code: "LY", name: "Libya", dialCode: "+218" },
  { code: "LI", name: "Liechtenstein", dialCode: "+423" },
  { code: "LT", name: "Lithuania", dialCode: "+370" },
  { code: "LU", name: "Luxembourg", dialCode: "+352" },
  { code: "MO", name: "Macao", dialCode: "+853" },
  { code: "MK", name: "Macedonia", dialCode: "+389" },
  { code: "MG", name: "Madagascar", dialCode: "+261" },
  { code: "MW", name: "Malawi", dialCode: "+265" },
  { code: "MY", name: "Malaysia", dialCode: "+60" },
  { code: "MV", name: "Maldives", dialCode: "+960" },
  { code: "ML", name: "Mali", dialCode: "+223" },
  { code: "MT", name: "Malta", dialCode: "+356" },
  { code: "MH", name: "Marshall Islands", dialCode: "+692" },
  { code: "MQ", name: "Martinique", dialCode: "+596" },
  { code: "MR", name: "Mauritania", dialCode: "+222" },
  { code: "MU", name: "Mauritius", dialCode: "+230" },
  { code: "YT", name: "Mayotte", dialCode: "+262" },
  { code: "MX", name: "Mexico", dialCode: "+52" },
  { code: "FM", name: "Micronesia", dialCode: "+691" },
  { code: "MD", name: "Moldova", dialCode: "+373" },
  { code: "MC", name: "Monaco", dialCode: "+377" },
  { code: "MN", name: "Mongolia", dialCode: "+976" },
  { code: "ME", name: "Montenegro", dialCode: "+382" },
  { code: "MS", name: "Montserrat", dialCode: "+1664" },
  { code: "MA", name: "Morocco", dialCode: "+212" },
  { code: "MZ", name: "Mozambique", dialCode: "+258" },
  { code: "MM", name: "Myanmar", dialCode: "+95" },
  { code: "NA", name: "Namibia", dialCode: "+264" },
  { code: "NR", name: "Nauru", dialCode: "+674" },
  { code: "NP", name: "Nepal", dialCode: "+977" },
  { code: "NL", name: "Netherlands", dialCode: "+31" },
  { code: "AN", name: "Netherlands Antilles", dialCode: "+599" },
  { code: "NC", name: "New Caledonia", dialCode: "+687" },
  { code: "NZ", name: "New Zealand", dialCode: "+64" },
  { code: "NI", name: "Nicaragua", dialCode: "+505" },
  { code: "NE", name: "Niger", dialCode: "+227" },
  { code: "NG", name: "Nigeria", dialCode: "+234" },
  { code: "NU", name: "Niue", dialCode: "+683" },
  { code: "NF", name: "Norfolk Island", dialCode: "+672" },
  { code: "MP", name: "Northern Mariana Islands", dialCode: "+1670" },
  { code: "NO", name: "Norway", dialCode: "+47" },
  { code: "OM", name: "Oman", dialCode: "+968" },
  { code: "PK", name: "Pakistan", dialCode: "+92" },
  { code: "PW", name: "Palau", dialCode: "+680" },
  { code: "PS", name: "Palestine", dialCode: "+970" },
  { code: "PA", name: "Panama", dialCode: "+507" },
  { code: "PG", name: "Papua New Guinea", dialCode: "+675" },
  { code: "PY", name: "Paraguay", dialCode: "+595" },
  { code: "PE", name: "Peru", dialCode: "+51" },
  { code: "PH", name: "Philippines", dialCode: "+63" },
  { code: "PN", name: "Pitcairn", dialCode: "+872" },
  { code: "PL", name: "Poland", dialCode: "+48" },
  { code: "PT", name: "Portugal", dialCode: "+351" },
  { code: "PR", name: "Puerto Rico", dialCode: "+1939" },
  { code: "QA", name: "Qatar", dialCode: "+974" },
  { code: "RE", name: "Reunion", dialCode: "+262" },
  { code: "RO", name: "Romania", dialCode: "+40" },
  { code: "RU", name: "Russia", dialCode: "+7" },
  { code: "RW", name: "Rwanda", dialCode: "+250" },
  { code: "BL", name: "Saint Barthelemy", dialCode: "+590" },
  { code: "SH", name: "Saint Helena", dialCode: "+290" },
  { code: "KN", name: "Saint Kitts and Nevis", dialCode: "+1869" },
  { code: "LC", name: "Saint Lucia", dialCode: "+1758" },
  { code: "MF", name: "Saint Martin", dialCode: "+590" },
  { code: "PM", name: "Saint Pierre and Miquelon", dialCode: "+508" },
  { code: "VC", name: "Saint Vincent and the Grenadines", dialCode: "+1784" },
  { code: "WS", name: "Samoa", dialCode: "+685" },
  { code: "SM", name: "San Marino", dialCode: "+378" },
  { code: "ST", name: "Sao Tome and Principe", dialCode: "+239" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966" },
  { code: "SN", name: "Senegal", dialCode: "+221" },
  { code: "RS", name: "Serbia", dialCode: "+381" },
  { code: "SC", name: "Seychelles", dialCode: "+248" },
  { code: "SL", name: "Sierra Leone", dialCode: "+232" },
  { code: "SG", name: "Singapore", dialCode: "+65" },
  { code: "SK", name: "Slovakia", dialCode: "+421" },
  { code: "SI", name: "Slovenia", dialCode: "+386" },
  { code: "SB", name: "Solomon Islands", dialCode: "+677" },
  { code: "SO", name: "Somalia", dialCode: "+252" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "GS", name: "South Georgia and Sandwich Islands", dialCode: "+500" },
  { code: "SS", name: "South Sudan", dialCode: "+211" },
  { code: "ES", name: "Spain", dialCode: "+34" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94" },
  { code: "SD", name: "Sudan", dialCode: "+249" },
  { code: "SR", name: "Suriname", dialCode: "+597" },
  { code: "SJ", name: "Svalbard and Jan Mayen", dialCode: "+47" },
  { code: "SZ", name: "Swaziland", dialCode: "+268" },
  { code: "SE", name: "Sweden", dialCode: "+46" },
  { code: "CH", name: "Switzerland", dialCode: "+41" },
  { code: "SY", name: "Syria", dialCode: "+963" },
  { code: "TW", name: "Taiwan", dialCode: "+886" },
  { code: "TJ", name: "Tajikistan", dialCode: "+992" },
  { code: "TZ", name: "Tanzania", dialCode: "+255" },
  { code: "TH", name: "Thailand", dialCode: "+66" },
  { code: "TL", name: "Timor-Leste", dialCode: "+670" },
  { code: "TG", name: "Togo", dialCode: "+228" },
  { code: "TK", name: "Tokelau", dialCode: "+690" },
  { code: "TO", name: "Tonga", dialCode: "+676" },
  { code: "TT", name: "Trinidad and Tobago", dialCode: "+1868" },
  { code: "TN", name: "Tunisia", dialCode: "+216" },
  { code: "TR", name: "Turkey", dialCode: "+90" },
  { code: "TM", name: "Turkmenistan", dialCode: "+993" },
  { code: "TC", name: "Turks and Caicos Islands", dialCode: "+1649" },
  { code: "TV", name: "Tuvalu", dialCode: "+688" },
  { code: "UG", name: "Uganda", dialCode: "+256" },
  { code: "UA", name: "Ukraine", dialCode: "+380" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "UY", name: "Uruguay", dialCode: "+598" },
  { code: "UZ", name: "Uzbekistan", dialCode: "+998" },
  { code: "VU", name: "Vanuatu", dialCode: "+678" },
  { code: "VE", name: "Venezuela", dialCode: "+58" },
  { code: "VN", name: "Vietnam", dialCode: "+84" },
  { code: "VG", name: "Virgin Islands, British", dialCode: "+1284" },
  { code: "VI", name: "Virgin Islands, U.S.", dialCode: "+1340" },
  { code: "WF", name: "Wallis and Futuna", dialCode: "+681" },
  { code: "YE", name: "Yemen", dialCode: "+967" },
  { code: "ZM", name: "Zambia", dialCode: "+260" },
  { code: "ZW", name: "Zimbabwe", dialCode: "+263" },
];

const DEFAULT_COUNTRY = COUNTRIES[0]; // Canada

/**
 * Parse an E.164 string into a country and local number.
 * E.g. "+15141234567" → { country: CA +1, local: "5141234567" }
 * Falls back to default country if no match.
 */
function parseE164(value: string): { country: Country; local: string } {
  if (!value || !value.startsWith("+")) {
    return { country: DEFAULT_COUNTRY, local: value || "" };
  }

  const sorted = [...COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  );

  for (const country of sorted) {
    if (value.startsWith(country.dialCode)) {
      return {
        country,
        local: value.slice(country.dialCode.length),
      };
    }
  }

  return { country: DEFAULT_COUNTRY, local: value.slice(2) };
}

interface PhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = "5141234567",
  disabled = false,
  className = "",
  size = "md",
}: PhoneInputProps) {
  const parsed = parseE164(value);
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    parsed.country,
  );
  const [localNumber, setLocalNumber] = useState<string>(parsed.local);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    const p = parseE164(value);
    setSelectedCountry(p.country);
    setLocalNumber(p.local);
  }, [value]);

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code) ?? DEFAULT_COUNTRY;
    setSelectedCountry(country);
    if (localNumber) {
      onChange(`${country.dialCode}${localNumber}`);
    }
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, capped to E.164 max (15 total - dial code digits)
    const maxLocal = 15 - (selectedCountry.dialCode.length - 1);
    const digits = e.target.value.replace(/\D/g, "").slice(0, maxLocal);
    setLocalNumber(digits);
    if (digits) {
      onChange(`${selectedCountry.dialCode}${digits}`);
    } else {
      onChange("");
    }
  };

  const padding = size === "sm" ? "px-2 py-1.5 text-sm" : "px-3 py-2 text-sm";
  const triggerPadding = size === "sm" ? "px-2 py-1.5 text-sm" : "px-2 py-2 text-sm";

  return (
    <div className={`flex ${className}`}>
      <div ref={dropdownRef} className="relative flex-shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDropdownOpen((o) => !o)}
          aria-label="Select country code"
          aria-expanded={dropdownOpen}
          className={`h-full flex items-center gap-1 ${triggerPadding} bg-[var(--bg-section)] border border-[var(--border-section)] border-r-0 rounded-l-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)] disabled:opacity-50 cursor-pointer whitespace-nowrap`}
        >
          <span>{getFlag(selectedCountry.code)}</span>
          <span>{selectedCountry.dialCode}</span>
          <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <ul
            role="listbox"
            className="absolute z-50 top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-section)] rounded-lg shadow-lg text-sm"
          >
            {COUNTRIES.map((c) => (
              <li
                key={c.code}
                role="option"
                aria-selected={c.code === selectedCountry.code}
                onClick={() => {
                  handleCountryChange(c.code);
                  setDropdownOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--bg-section)] ${
                  c.code === selectedCountry.code ? "bg-[var(--bg-section)] font-medium" : ""
                }`}
              >
                <span>{getFlag(c.code)}</span>
                <span className="flex-1 truncate text-[var(--text-primary)]">{c.name}</span>
                <span className="text-[var(--text-muted)] flex-shrink-0">{c.dialCode}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        type="tel"
        inputMode="numeric"
        value={localNumber}
        onChange={handleLocalChange}
        maxLength={15 - (selectedCountry.dialCode.length - 1)}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Phone number"
        className={`relative flex-1 ${padding} bg-[var(--bg-section)] border border-[var(--border-section)] rounded-r-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:z-10 disabled:opacity-50`}
      />
    </div>
  );
}
