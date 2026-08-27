import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

/* ImageResponse / Satori only supports <img>, not next/image. */
/* eslint-disable @next/next/no-img-element */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "HR Recruitment · Aeris Beaute and From This Island";

async function logoSrc(path: string, height: number) {
  const raw = await readFile(path);
  const png = await sharp(raw)
    .trim({ threshold: 20 })
    .resize({ height, withoutEnlargement: true })
    .png()
    .toBuffer();
  const meta = await sharp(png).metadata();
  return {
    src: `data:image/png;base64,${png.toString("base64")}`,
    width: meta.width ?? height,
    height: meta.height ?? height,
  };
}

export async function generateOgImage() {
  const aeris = await logoSrc(
    join(process.cwd(), "public/logo/aerisbeaute/Aeris new logo-white-01.png"),
    72,
  );
  const fti = await logoSrc(
    join(process.cwd(), "public/logo/fti/FTI_Logogram_White.png"),
    88,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #3F1F28 0%, #1C1412 46%, #0E2F2C 100%)",
          color: "white",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -40,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "rgba(154, 74, 92, 0.45)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: -80,
            width: 440,
            height: 440,
            borderRadius: 999,
            background: "rgba(31, 107, 100, 0.5)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              alt="Aeris Beaute"
              src={aeris.src}
              width={aeris.width}
              height={aeris.height}
            />
            <div
              style={{
                width: 2,
                height: 44,
                marginLeft: 28,
                marginRight: 28,
                background: "rgba(255,255,255,0.25)",
              }}
            />
            <img
              alt="From This Island"
              src={fti.src}
              width={fti.width}
              height={fti.height}
            />
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 18,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.58)",
            }}
          >
            HR Recruitment
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            <div>Your hiring</div>
            <div style={{ color: "#C9DDD8", marginLeft: 16 }}>workspace.</div>
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 22,
              color: "rgba(255,255,255,0.62)",
            }}
          >
            Aeris Beaute · From This Island
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
