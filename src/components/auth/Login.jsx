// components/auth/Login.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../common/Card";
import Button from "../common/Button";
import Input from "../common/Input";
import {
  fadeInUp,
  staggerContainer,
  shake
} from "../common/animations";
import {
  faArrowRightToBracket,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";

const loginContainer = staggerContainer(0.1);

const Login = () => {
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!cedula.trim()) {
      setError("Please enter your ID number");
      setLoading(false);
      return;
    }

    const result = await login(cedula.trim());

    if (!result.success) {
      setError(result.error || "Error logging in");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={loginContainer}
        className="w-full max-w-md"
      >
        <Card>
          <motion.div variants={fadeInUp} className="text-center mb-8">
            <div className="flex flex-wrap justify-center items-center gap-2">
              <img src="images/logo.svg" alt="Clocker Logo" className="w-40" />
              <p className="text-gray-600 mt-2 w-full font-medium tracking-tight">
                Status Management System
              </p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Identification
              </label>
              <Input
                type="password"
                value={cedula}
                icon={faIdCard}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Enter your ID number"
                disabled={loading}
                fullWidth
              />
            </motion.div>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error-message"
                  variants={shake}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-vgsred p-3 rounded-md text-sm border-2 border-dashed border-vgsred font-bold flex items-center justify-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div variants={fadeInUp}>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                variant="blue"
                icon={faArrowRightToBracket}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </motion.div>
          </form>
        </Card>
        <motion.p
          variants={fadeInUp}
          className="text-center text-vgsgray text-xs mt-8 opacity-50"
        >
          © {new Date().getFullYear()} Clocker. All rights reserved to VGS.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;