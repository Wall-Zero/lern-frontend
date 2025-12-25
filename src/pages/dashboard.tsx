// src/pages/dashboard.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth.context";
import "./dashboard.css";

import {
  uploadCsvDataSource,
  analyzeTool,
  configureTool,
  generateCode,
  trainModel,
} from "../api/api";

type FeatureCol = { name: string; type: string };

type RequiredConfig = {
  target_column: string;
  feature_columns: FeatureCol[];
};

type Approach = {
  name: string;
  algorithm: string;
  model_type: string;
  description?: string;
  pros?: string[];
  cons?: string[];
  expected_accuracy?: number;
  hyperparameters?: Record<string, any>;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Upload
  const [csvName, setCsvName] = useState("");
  const [csvDesc, setCsvDesc] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dataSourceId, setDataSourceId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Analyze
  const [toolName, setToolName] = useState("");
  const [intent, setIntent] = useState("predict any future values as your decision");
  const [aiModel, setAiModel] = useState("");

  const [toolId, setToolId] = useState<number | null>(null);
  const [approaches, setApproaches] = useState<Approach[]>([]);
  const [requiredConfig, setRequiredConfig] = useState<RequiredConfig | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Configure
  const [selectedApproach, setSelectedApproach] = useState("");
  const [modelType, setModelType] = useState("");
  const [targetColumn, setTargetColumn] = useState("");
  const [featureColumns, setFeatureColumns] = useState("");
  const [algorithm, setAlgorithm] = useState("");
  const [hyperparameters, setHyperparameters] = useState("{}");
  const [trainTestSplit, setTrainTestSplit] = useState(0.8);
  const [randomState, setRandomState] = useState(42);

  const currentApproach = approaches[selectedIdx];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const clearCsvFile = () => setCsvFile(null);

  const handleUploadCsv = async () => {
    if (!csvFile || !csvName) {
      alert("CSV name and file required");
      return;
    }

    try {
      setUploading(true);

      const ds = await uploadCsvDataSource({
        name: csvName,
        type: "csv",
        description: csvDesc || undefined,
        file: csvFile,
      });

      setDataSourceId(ds.id);
      alert(`CSV uploaded (data_source_id=${ds.id})`);
    } catch (e: any) {
      alert(`Upload failed: ${e.response?.data?.error || e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!dataSourceId) {
      alert("Upload CSV first");
      return;
    }

    try {
      const tool = await analyzeTool({
        name: toolName,
        intent,
        data_source_id: dataSourceId,
        ai_model: aiModel,
      });

      setToolId(tool.id);
      setApproaches(tool.approaches || tool.analysis?.approaches || []);
      setRequiredConfig(tool.required_config || tool.analysis?.required_config || null);
      setSelectedIdx(0);

      alert("Analyze OK");
    } catch (e: any) {
      alert(`Analyze failed: ${e.response?.data?.error || e.message}`);
    }
  };

  const handleUseApproach = () => {
    if (!currentApproach) return;

    setSelectedApproach(currentApproach.name);
    setModelType(currentApproach.model_type);
    setAlgorithm(currentApproach.algorithm);

    if (requiredConfig) {
      setTargetColumn(requiredConfig.target_column);
      setFeatureColumns(requiredConfig.feature_columns.map((f) => f.name).join(","));
    }

    const hp = currentApproach.hyperparameters || {};
    if (typeof hp.random_state === "number") setRandomState(hp.random_state);

    setHyperparameters(JSON.stringify(hp, null, 2));
  };

  const handleConfigure = async () => {
    if (!toolId) {
      alert("Analyze first");
      return;
    }

    let hp: any = {};
    try {
      hp = JSON.parse(hyperparameters || "{}");
    } catch {
      alert("hyperparameters must be valid JSON");
      return;
    }

    const features = featureColumns
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, type: "feature" }));

    if (!targetColumn || features.length === 0) {
      alert("target_column and feature_columns are required");
      return;
    }

    try {
      await configureTool(toolId, {
        selected_approach: selectedApproach,
        model_type: modelType,
        target_column: targetColumn,
        feature_columns: features,
        algorithm,
        hyperparameters: { ...hp, random_state: randomState },
        train_test_split: trainTestSplit,
        random_state: randomState,
      });

      alert("Configure OK");
    } catch (e: any) {
      alert(`Configure failed: ${e.response?.data?.error || e.message}`);
    }
  };

  const handleGenerateCode = async () => {
    if (!toolId) return alert("Need toolId");
    try {
      const res = await generateCode(toolId);
      alert("Generate code OK");
      console.log(res);
    } catch (e: any) {
      alert(`Generate code failed: ${e.response?.data?.error || e.message}`);
    }
  };

  const handleTrain = async () => {
    if (!toolId) return alert("Need toolId");
    try {
      const res = await trainModel(toolId);
      alert("Train OK");
      console.log(res);
    } catch (e: any) {
      alert(`Train failed: ${e.response?.data?.error || e.message}`);
    }
  };

  return (
    <div className="dash">
      <header className="dash-header">
        <h2 className="dash-title">LERN</h2>
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <section className="card">
        <h3 className="card-title">Upload CSV</h3>

        <div className="grid">
          <input className="input" placeholder="CSV name" value={csvName} onChange={(e) => setCsvName(e.target.value)} />
          <input className="input" placeholder="Description (optional)" value={csvDesc} onChange={(e) => setCsvDesc(e.target.value)} />

          <div className="row">
            <input className="input" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
            {csvFile && (
              <button className="btn btn--icon" type="button" onClick={clearCsvFile} title="Remove file">
                ✕
              </button>
            )}
          </div>

          <button className="btn" onClick={handleUploadCsv} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </section>
      <section className="card">
        <h3 className="card-title">Analyze</h3>

        <div className="grid">
          <input className="input" placeholder="Tool name" value={toolName} onChange={(e) => setToolName(e.target.value)} />
          <input className="input" placeholder="Intent" value={intent} onChange={(e) => setIntent(e.target.value)} />
          <input className="input" placeholder="AI model (e.g. gemini)" value={aiModel} onChange={(e) => setAiModel(e.target.value)} />

          <button className="btn" onClick={handleAnalyze} disabled={!dataSourceId}>
            Analyze
          </button>

          {approaches.length > 0 && (
            <div className="subcard">
              <h4 className="subcard-title">Approaches</h4>

              <select className="select" value={selectedIdx} onChange={(e) => setSelectedIdx(Number(e.target.value))}>
                {approaches.map((a, idx) => (
                  <option value={idx} key={idx}>
                    {a.name} ({a.algorithm})
                  </option>
                ))}
              </select>

              {currentApproach && (
                <div className="approach">
                  <div className="approach__name">{currentApproach.name}</div>
                  <div className="muted">
                    algorithm: <b>{currentApproach.algorithm}</b> | model_type: <b>{currentApproach.model_type}</b>
                  </div>

                  {typeof currentApproach.expected_accuracy === "number" && (
                    <div className="kv">
                      expected_accuracy: <b>{currentApproach.expected_accuracy}</b>
                    </div>
                  )}

                  {currentApproach.description && <p className="p">{currentApproach.description}</p>}

                  {currentApproach.pros?.length ? (
                    <div className="listBlock">
                      <div className="listBlock__title">Pros</div>
                      <ul className="ul">
                        {currentApproach.pros.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {currentApproach.cons?.length ? (
                    <div className="listBlock">
                      <div className="listBlock__title">Cons</div>
                      <ul className="ul">
                        {currentApproach.cons.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {requiredConfig && (
                    <div className="kv">
                      <div>
                        target_column: <b>{requiredConfig.target_column}</b>
                      </div>
                      <div className="truncate">
                        features: <b>{requiredConfig.feature_columns.map((f) => f.name).join(", ")}</b>
                      </div>
                    </div>
                  )}

                  <button className="btn" type="button" onClick={handleUseApproach}>
                    Use this approach to Configure Section
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      <section className="card">
        <h3 className="card-title">Configure</h3>

        <div className="grid">
          <input className="input" placeholder="selected_approach" value={selectedApproach} onChange={(e) => setSelectedApproach(e.target.value)} />
          <input className="input" placeholder="model_type" value={modelType} onChange={(e) => setModelType(e.target.value)} />
          <input className="input" placeholder="target_column" value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)} />
          <input className="input" placeholder="feature_columns (comma separated)" value={featureColumns} onChange={(e) => setFeatureColumns(e.target.value)} />
          <input className="input" placeholder="algorithm" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} />

          <div className="row">
            <input className="input" type="number" step="0.01" min="0.1" max="0.95" placeholder="train_test_split" value={trainTestSplit} onChange={(e) => setTrainTestSplit(Number(e.target.value))} />
            <input className="input" type="number" placeholder="random_state" value={randomState} onChange={(e) => setRandomState(Number(e.target.value))} />
          </div>

          <label className="label">hyperparameters (JSON)</label>
          <textarea className="textarea" rows={7} value={hyperparameters} onChange={(e) => setHyperparameters(e.target.value)} />

          <button className="btn" onClick={handleConfigure} disabled={!toolId}>
            Configure
          </button>
        </div>
      </section>
      <section className="card">
        <h3 className="card-title">Generate Code</h3>
        <button className="btn" onClick={handleGenerateCode} disabled={!toolId}>
          Generate Code
        </button>
      </section>
      <section className="card">
        <h3 className="card-title">Train</h3>
        <button className="btn" onClick={handleTrain} disabled={!toolId}>
          Train
        </button>
      </section>
    </div>
  );
}
