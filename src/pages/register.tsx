// src/pages/RegisterPage.tsx
import { useState } from "react";
import { register } from "../auth/auth.service";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    password2: ""
  });

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      alert("Register failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>

      {Object.keys(form).map(key => (
        <input
          key={key}
          placeholder={key}
          type={key.includes("password") ? "password" : "text"}
          value={(form as any)[key]}
          onChange={e =>
            setForm({ ...form, [key]: e.target.value })
          }
        />
      ))}

      <button type="submit">Register</button>
    </form>
  );
}
