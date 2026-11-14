import LoadingImage from "../../components/LoadingImage";
import React, { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { homeData } from "../../data/home";
import { api, ErrorBox, Heading } from "../shared";

export default function AuthPage({ mode, go, onLogin, returnTo }) {
  const register = mode === "register";
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="cx-auth">
      <div className="cx-auth-image">
        <LoadingImage src={homeData.hero} alt="ห้องพักเรือนรมย์" />
        <div>
          <span className="rr-kicker">WELCOME TO RUENROM</span>
          <h2>
            Your next chapter
            <br />
            <em>starts here.</em>
          </h2>
        </div>
      </div>
      <div className="cx-auth-form">
        <Heading
          label="A LITTLE CLOSER TO HOME"
          title={
            mode === "forgot"
              ? "A fresh start."
              : register
                ? "Make yourself at home."
                : "Welcome back."
          }
        >
          {mode === "forgot"
            ? "ความช่วยเหลือเกี่ยวกับรหัสผ่าน"
            : register
              ? "สมัครสมาชิกเพื่อจัดการการพักผ่อนของคุณ"
              : "เข้าสู่ระบบเพื่อเดินทางต่อ"}
        </Heading>
        {mode === "forgot" ? (
          <>
            <div className="cx-note">
              <LockKeyhole />
              <p>
                ระบบยังไม่รองรับส่งลิงก์รีเซ็ตรหัสผ่านทางอีเมล
                กรุณาติดต่อพนักงานโรงแรมเพื่อขอความช่วยเหลือ
              </p>
            </div>
            <button
              className="rr-button"
              onClick={() => go("/login", { returnTo })}
            >
              กลับเข้าสู่ระบบ
            </button>
          </>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setBusy(true);
              setError("");
              const values = Object.fromEntries(new FormData(e.currentTarget));
              try {
                const user = await api(
                  "/auth/" + (register ? "register" : "login"),
                  values,
                );
                onLogin(user);
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <ErrorBox message={error} />
            {register && (
              <label>
                <span>
                  <UserRound />
                  ชื่อ–นามสกุล
                </span>
                <input
                  required
                  name="name"
                  maxLength={120}
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              <span>
                <Mail />
                อีเมล
              </span>
              <input
                required
                name="email"
                type="email"
                maxLength={190}
                autoComplete="email"
              />
            </label>
            <label>
              <span>
                <LockKeyhole />
                รหัสผ่าน
              </span>
              <div className="cx-password">
                <input
                  required
                  name="password"
                  type={visible ? "text" : "password"}
                  minLength={10}
                  maxLength={128}
                  autoComplete={register ? "new-password" : "current-password"}
                  aria-describedby="password-help"
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {visible ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>
            <p className="cx-caption" id="password-help">
              อย่างน้อย 10 ตัวอักษร
            </p>
            {!register && (
              <button
                className="cx-text"
                type="button"
                onClick={() => go("/forgot-password", { returnTo })}
              >
                ลืมรหัสผ่าน?
              </button>
            )}
            <button disabled={busy} className="rr-button cx-wide">
              {busy ? "กำลังดำเนินการ…" : register ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
              <ArrowRight />
            </button>
            <p className="cx-auth-switch">
              {register ? "มีบัญชีแล้ว?" : "ยังไม่มีบัญชี?"}{" "}
              <button
                className="cx-text"
                type="button"
                onClick={() =>
                  go(register ? "/login" : "/register", { returnTo })
                }
              >
                {register ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
