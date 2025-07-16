import React, { useCallback, useRef, useState, createContext, useContext, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  NodeResizeControl
} from "reactflow";
import type { ReactFlowInstance, Connection, Edge, Node } from "reactflow";
import "reactflow/dist/style.css";

import './home.css'

import { Layout, Button, Divider, Typography, Upload } from "antd";
import { UploadOutlined, PlayCircleOutlined , InfoCircleOutlined } from "@ant-design/icons";
import { useDrop, useDrag } from "react-dnd";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const { Sider, Content } = Layout;
const { Title } = Typography;

type NodeType = "input" | "function-canny" | "function-grayscale" | "function-blur" | "function-threshold" | "function-blue" | "function-red" | "function-green" | "function-rotate" | "output" | "function-color_quantization" | "function-cartoon" | "function-histogram_equalization" | "function-sharpen" | "function-fourier_transform" | "function-edge_detection" | "function-stylization" | "function-perspective_transform";

interface SidebarItemProps {
  type: NodeType;
  label: string;
}

interface SidebarMenuProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}


interface ExtendedNodeData {
  image?: File;
  imageUrl?: string;
  resultImage?: string;
  selectedFunction?: string;
  onImageUpload?: (file: File, url: string) => void;
  runProcessing?: () => void;
  width?: number;
  height?: number;
  params?: Record<string, any>; // 👈 Aggiunto per i parametri delle funzioni
}

interface InfoWidgetProps {
  title: string;
  description: string;
  onClose: () => void;
}

interface FunctionNodeProps {
  id: string;
  data: ExtendedNodeData;
  label: string;
  onShowInfo: () => void;
}

const ParamsWidget: React.FC<{
  nodeId: string;
  params: Record<string, any>;
  onClose: () => void;
  onSave: (params: Record<string, any>) => void;
  functionType: string;
}> = ({ nodeId, params, onClose, onSave, functionType }) => {
  const [localParams, setLocalParams] = useState(params);

  useEffect(() => {
    setLocalParams(params); // Aggiorna i parametri locali quando cambiano quelli esterni
  }, [params]);

  const paramConfigs = {
    canny: [
      { key: 'threshold1', label: 'Min Threshold', min: 0, max: 255, defaultValue: 100 },
      { key: 'threshold2', label: 'Max Threshold', min: 0, max: 255, defaultValue: 200 }
    ],
    blur: [
      { key: 'kernelSize', label: 'Kernel Size', min: 1, max: 31, defaultValue: 5, step: 2 }
    ],
    threshold: [
      { key: 'thresh', label: 'Threshold', min: 0, max: 255, defaultValue: 127 }
    ],
    rotate: [
      { key: 'angle', label: 'Angle', min: -360, max: 360, defaultValue: 90 }
    ],
    color_quantization: [
      { key: 'q_color', label: 'Colors', min: 2, max: 32, defaultValue: 10 }
    ],
    cartoon: [
      { key: 'c_color', label: 'Colors', min: 1, max: 8, defaultValue: 4 }
    ],
    sharpen: [
      { key: 'strength', label: 'Strength', min: 1, max: 5, defaultValue: 2 }
    ],
    edge_detection: [
      { key: 'method', label: 'Metodo', type: 'select', options: ['sobel', 'scharr', 'laplacian'], defaultValue: 'sobel' },
      { key: 'ksize', label: 'Dimensione Kernel', min: 1, max: 7, step: 2, defaultValue: 3 }
    ],
    stylization: [
      { key: 'stylization_strength', label: 'Intensità Stile', min: 1, max: 200, defaultValue: 100 },
      { key: 'edge_preserve', label: 'Conservazione Bordi', min: 1, max: 100, defaultValue: 50 }
    ],
    perspective_transform: [
      { key: 'points', label: 'Punti Trasformazione', type: 'point_editor' }
    ]
  };

  const currentConfig = paramConfigs[functionType] || [];

  const handleParamChange = (key: string, value: string) => {
    // Per i parametri di tipo select, usa il valore direttamente
    const isSelect = currentConfig.some(config => config.key === key && config.type === 'select');
    const newValue = isSelect ? value : (value === '' ? paramConfigs[functionType].find(c => c.key === key)?.defaultValue || 0 : parseInt(value) || 0);
    
    setLocalParams(prev => ({ ...prev, [key]: newValue }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: 316,
      zIndex: 1001,
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: 8,
      padding: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      width: 250
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>Parametri</h4>
        <Button size="small" onClick={onClose}>X</Button>
      </div>
      
      {currentConfig.map(config => {
        const value = localParams[config.key] ?? config.defaultValue;
        return (
          <div key={config.key} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
              {config.label}
            </label>
            {config.type === 'select' ? (
              <select
                value={value}
                onChange={(e) => handleParamChange(config.key, e.target.value)}
                style={{
                  width: '100%',
                  padding: 6,
                  borderRadius: 4,
                  border: '1px solid #d9d9d9'
                }}
              >
                {config.options.map(opt => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            ) : config.type === 'point_editor' ? (
              <div style={{ color: '#999', fontStyle: 'italic' }}>
                Editor punti da implementare
              </div>
            ) : (
              <input
                type="number"
                min={config.min}
                max={config.max}
                step={config.step || 1}
                value={value}
                onChange={(e) => handleParamChange(config.key, e.target.value)}
                style={{
                  width: '100%',
                  padding: 6,
                  borderRadius: 4,
                  border: '1px solid #d9d9d9'
                }}
              />
            )}
          </div>
        );
      })}
      
      <Button 
        type="primary" 
        onClick={() => onSave(localParams)}
        style={{ marginTop: 12, width: '100%' }}
      >
        Salva
      </Button>
    </div>
  );
};


const InfoWidget: React.FC<InfoWidgetProps> = ({ title, description, onClose }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Calcola il centro della pagina al primo render
  useEffect(() => {
    if (widgetRef.current) {
      const x = window.innerWidth / 2 - widgetRef.current.offsetWidth / 2;
      const y = window.innerHeight / 2 - widgetRef.current.offsetHeight / 2;
      setPosition({ x, y });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.stopPropagation();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setPosition({
      x: newX,
      y: newY
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={widgetRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1002,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        width: 300,
        cursor: isDragging ? 'grabbing' : 'default',
        pointerEvents: 'auto', // Importante per evitare interferenze
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 12,
          borderBottom: '1px solid #eee',
          paddingBottom: 8,
          cursor: 'move',
          userSelect: 'none',
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        <Button 
          type="text" 
          shape="circle" 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{ border: 'none' }}
        >
          ×
        </Button>
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{description}</p>
    </div>
  );
};

const InputNode: React.FC<{ data: ExtendedNodeData }> = ({ data }) => {
  return (
    <div
      style={{
        background: "#f0f4f8",
        padding: 12,
        borderRadius: 12,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        boxSizing: "border-box",
        overflow: "visible",
      }}
    >
      <Handle
        type="source"
        position={Position.Right}
        style={{
          top: "50%",
          transform: "translateY(-50%) translateX(40%)",
          background: "#555",
          border: "2px solid white",
          width: 10,
          height: 10,
          zIndex: 10,
        }}
      />

      <strong style={{ fontSize: 14, marginBottom: 8 }}>Input</strong>

      <Upload
        accept="image/*"
        showUploadList={false}
        beforeUpload={(file) => {
          const url = URL.createObjectURL(file);
          data.onImageUpload?.(file, url);
          return false;
        }}
      >
        <Button
          icon={<UploadOutlined />}
          style={{
            width: 100,
            fontSize: 12,
            padding: "4px 8px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            marginBottom: 12,
          }}
        >
          Carica
        </Button>
      </Upload>

      {data.imageUrl && (
        <img
          src={data.imageUrl}
          alt="preview"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
      )}
    </div>
  );
};




const functionsWithParams = new Set(['canny', 'blur', 'threshold', 'rotate']);

const FunctionNode: React.FC<FunctionNodeProps> = ({ id, data, label, onShowInfo }) => {
  const needsParams = ['canny', 'blur', 'threshold', 'rotate', 'color_quantization', 
  'cartoon', 'sharpen', 'edge_detection', 'stylization', 'perspective_transform']
  .includes(data.selectedFunction || '');

  return (
    <div style={{
      background: '#e6f7ff',
      padding: 16,
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minWidth: 200,
    }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <div style={{ 
        fontWeight: 'bold',
        marginBottom: 12,
        fontSize: 14,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>{label}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            size="small" 
            icon={<InfoCircleOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onShowInfo();
            }}
            style={{
              backgroundColor: "transparent",
              border: "none",
              boxShadow: "none",
            }}
          />
          {needsParams && (
            <Button 
              size="small" 
              style={{
                backgroundColor:"rgb(130, 200, 223)",
                border: "none",
                boxShadow: "0px 0px 5px rgba(0,0,0,0.7)",
                borderRadius: "0px"
              }}
              onClick={(e) => {
                e.stopPropagation();
                const event = new CustomEvent('openParamsWidget', { detail: { nodeId: id } });
                window.dispatchEvent(event);
              }}
            >
              Parametri
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const RunHandlerContext = createContext<(id: string) => void>(() => {});

const MIN_WIDTH = 400;
const MIN_HEIGHT = 400;

const OutputNode: React.FC<{ id: string; data: ExtendedNodeData }> = ({ id, data }) => {
  const run = useContext(RunHandlerContext);

  const handleDownload = () => {
    if (!data.resultImage) return;
    const link = document.createElement("a");
    link.href = data.resultImage;
    link.download = "processed_image.png";
    link.click();
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <NodeResizeControl
        style={{ position: "absolute", right: 8, bottom: 8 }}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
      >
        <ResizeIcon />
      </NodeResizeControl>

      <div
        style={{
          background: "#fffce6",
          padding: 12,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <Handle type="target" position={Position.Left} />

        <strong style={{ fontSize: 16, marginBottom: 8 }}>Output</strong>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Button 
            icon={<PlayCircleOutlined />} 
            type="primary" 
            onClick={(e) => {
              e.stopPropagation();
              run(id);
            }}
          >
            Run
          </Button>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }} 
            disabled={!data.resultImage}
          >
            Download
          </Button>
        </div>

        <div
          style={{
            flexGrow: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          {data.resultImage && (
            <img
              src={data.resultImage}
              alt="output"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ResizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="#ff0071" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 20 20 20 20 16" />
    <line x1="14" y1="14" x2="20" y2="20" />
    <polyline points="8 4 4 4 4 8" />
    <line x1="4" y1="4" x2="10" y2="10" />
  </svg>
);





const SidebarMenu: React.FC<SidebarMenuProps> = ({ 
  title, 
  defaultOpen = false,
  children 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="sidebar-menu">
      <div 
        className="menu-header" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span className={`menu-icon ${isOpen ? 'open' : ''}`}>▶</span>
      </div>
      <div className={`menu-items ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
};






const SidebarItem: React.FC<SidebarItemProps> = ({ type, label }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [, drag] = useDrag(() => ({ 
    type: "node", 
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  
  drag(ref);
  
  return (
    <div ref={ref} className="menu-item">
      {label}
    </div>
  );
};

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ExtendedNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [contextNodeId, setContextNodeId] = useState<string | null>(null);
  const [paramsNodeId, setParamsNodeId] = useState<string | null>(null); 
   const [infoWidget, setInfoWidget] = useState<{
    show: boolean;
    title: string;
    description: string;
  }>({ show: false, title: '', description: '' });

  const functionDescriptions = {
    canny: "Rileva i bordi nell'immagine usando l'algoritmo Canny. I parametri controllano le soglie per il rilevamento dei bordi.",
    grayscale: "Converte l'immagine a colori in scala di grigi.",
    blur: "Applica un effetto di sfocatura gaussiana all'immagine. Il parametro controlla l'intensità della sfocatura.",
    threshold: "Converte l'immagine in bianco e nero basandosi su una soglia di luminosità.",
    blue: "Mostra solo il canale blu dell'immagine.",
    red: "Mostra solo il canale rosso dell'immagine.",
    green: "Mostra solo il canale verde dell'immagine.",
    rotate: "Ruota l'immagine di un angolo specificato in gradi.",
    color_quantization: "Riduce il numero di colori nell'immagine usando l'algoritmo K-means. Il parametro controlla quanti colori mantenere.",
    cartoon: "Crea un effetto cartoon combinando la riduzione dei colori e l'enfatizzazione dei bordi.",
    histogram_equalization: "Migliora il contrasto dell'immagine equalizzando l'istogramma dei valori di luminosità.",
    sharpen: "Aumenta la nitidezza dell'immagine accentuando i bordi. Il parametro controlla l'intensità dell'effetto.",
    fourier_transform: "Mostra la trasformata di Fourier dell'immagine, visualizzando lo spettro di frequenze.",
    edge_detection: "Rileva i bordi nell'immagine usando diversi metodi (Sobel, Scharr, Laplacian).",
    stylization: "Applica un effetto artistico all'immagine, simile alle app come Prisma.",
    perspective_transform: "Applica una trasformazione prospettica per correggere o distorcere l'immagine."
  };

  const handleShowInfo = (functionType: string) => {
    setInfoWidget({
      show: true,
      title: functionType.charAt(0).toUpperCase() + functionType.slice(1).replace('_', ' '),
      description: functionDescriptions[functionType as keyof typeof functionDescriptions] || "Descrizione non disponibile."
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disabilita l'eliminazione con tasto Canc/Backspace solo se non siamo in un input
      const activeElement = document.activeElement;
      if (['Delete', 'Backspace'].includes(e.key) && activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOpenParamsWidget = (e: CustomEvent) => {
      setParamsNodeId(e.detail.nodeId);
    };

    // Aggiungi listener per l'evento personalizzato
    const eventListener = (e: Event) => handleOpenParamsWidget(e as CustomEvent);
    window.addEventListener('openParamsWidget', eventListener);

    return () => {
      window.removeEventListener('openParamsWidget', eventListener);
    };
  }, []);



  const nodeTypes = useMemo(() => ({
    input: InputNode,
    "function-canny": (p: any) => <FunctionNode {...p} label="Canny" onShowInfo={() => handleShowInfo('canny')} />,
    "function-grayscale": (p: any) => <FunctionNode {...p} label="Grayscale" onShowInfo={() => handleShowInfo('grayscale')} />,
    "function-blur": (p: any) => <FunctionNode {...p} label="Blur" onShowInfo={() => handleShowInfo('blur')} />,
    "function-threshold": (p: any) => <FunctionNode {...p} label="Threshold" onShowInfo={() => handleShowInfo('threshold')} />,
    "function-blue": (p: any) => <FunctionNode {...p} label="Blue Channel" onShowInfo={() => handleShowInfo('blue')} />,
    "function-red": (p: any) => <FunctionNode {...p} label="Red Channel" onShowInfo={() => handleShowInfo('red')} />,
    "function-green": (p: any) => <FunctionNode {...p} label="Green Channel" onShowInfo={() => handleShowInfo('green')} />,
    "function-rotate": (p: any) => <FunctionNode {...p} label="Rotate" onShowInfo={() => handleShowInfo('rotate')} />,
    "function-color_quantization": (p: any) => <FunctionNode {...p} label="Color Quantization" onShowInfo={() => handleShowInfo('color_quantization')} />,
    "function-cartoon": (p: any) => <FunctionNode {...p} label="Cartoon" onShowInfo={() => handleShowInfo('cartoon')} />,
    "function-histogram_equalization": (p: any) => <FunctionNode {...p} label="Histogram Equalization" onShowInfo={() => handleShowInfo('histogram_equalization')} />,
    "function-sharpen": (p: any) => <FunctionNode {...p} label="Sharpen" onShowInfo={() => handleShowInfo('sharpen')} />,
    "function-fourier_transform": (p: any) => <FunctionNode {...p} label="Fourier Transform" onShowInfo={() => handleShowInfo('fourier_transform')} />,
    "function-edge_detection": (p: any) => <FunctionNode {...p} label="Edge Detection" onShowInfo={() => handleShowInfo('edge_detection')} />,
    "function-stylization": (p: any) => <FunctionNode {...p} label="Stylization" onShowInfo={() => handleShowInfo('stylization')} />,
    "function-perspective_transform": (p: any) => <FunctionNode {...p} label="Perspective Transform" onShowInfo={() => handleShowInfo('perspective_transform')} />,
    output: OutputNode,
}), []);

  const updateNodeData = useCallback((id: string, newData: Partial<ExtendedNodeData>) =>
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n)), [setNodes]);


  const handleSaveParams = useCallback((nodeId: string, newParams: Record<string, any>) => {
    setNodes(nds => nds.map(n => 
      n.id === nodeId ? { ...n, data: { ...n.data, params: newParams } } : n
    ));
    setParamsNodeId(null); // Chiudi il widget dopo il salvataggio
  }, [setNodes]);

  
  const handleRun = useCallback(async (outputId: string) => {
    const visited: Set<string> = new Set();
    const path: Node<ExtendedNodeData>[] = [];

    // Funzione ricorsiva per costruire il path
    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const incoming = edges.find((e) => e.target === nodeId);
      if (incoming) {
        traverse(incoming.source);
      }
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        path.push(node);
      }
    };

    traverse(outputId);

    const sortedPath = path.filter(n => n.type !== 'output').reverse();

    const inputNode = sortedPath.find(n => n.type === "input");
    if (!inputNode || !inputNode.data.image) {
      console.warn("Nessun nodo input trovato con immagine.");
      return;
    }

    const operations = sortedPath
      .filter(n => n.type?.startsWith("function-"))
      .map(n => ({
        type: n.data.selectedFunction,
        params: n.data.params || {}
      }));


    const formData = new FormData();
    formData.append("file", inputNode.data.image);
    formData.append("operations", JSON.stringify(operations));

  try {
    const res = await axios.post("http://localhost:8000/process", formData, {
      responseType: "blob",
    });

    // Rilascio del vecchio blob, se esiste
    if (nodes.find(n => n.id === outputId)?.data.resultImage) {
      URL.revokeObjectURL(nodes.find(n => n.id === outputId)!.data.resultImage);
    }

    const imageURL = URL.createObjectURL(res.data);
    updateNodeData(outputId, { resultImage: imageURL });
  } catch (error) {
    console.error("Errore durante l'elaborazione:", error);
  }
  }, [nodes, edges, updateNodeData]);



  const onResize = useCallback((id: string, width: number, height: number) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, width, height, data: { ...n.data, width, height } } : n));
  }, [setNodes]);

  const [, drop] = useDrop(() => ({
    accept: "node",
    drop: (item: { type: NodeType }, monitor) => {
      const off = monitor.getClientOffset();
      if (!off || !reactFlowWrapper.current || !reactFlowInstance) return;
      const pos = reactFlowInstance.screenToFlowPosition(off);
      const id = uuidv4();
      let data: ExtendedNodeData = {};
      let nodeProps: Partial<Node<ExtendedNodeData>> = {};
      
      if (item.type === "input") {
        data.onImageUpload = (f, u) => updateNodeData(id, { image: f, imageUrl: u });
      } else if (item.type === "output") {
        nodeProps = { width: 300, height: 300 };
        data = { ...data }; // Nessuna funzione specifica qui
      } else {
        data.selectedFunction = item.type.replace("function-", "");
      }
      
      setNodes(nds => [...nds, { 
        id, 
        type: item.type, 
        position: pos, 
        data, 
        ...nodeProps 
      }]);
    }
  }), [reactFlowInstance, updateNodeData, onResize, setNodes]);

  const onConnect = useCallback((p: Edge | Connection) => setEdges(es => addEdge(p, es)), [setEdges]);

  return (
  <RunHandlerContext.Provider value={handleRun}>
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Nuova Sidebar personalizzata */}
      <div className="sidebar">
        <Title level={4} style={{ color: 'white', padding: '10px 15px' }}>Blocchi</Title>
        
        <SidebarMenu title="Inputs" defaultOpen>
          <SidebarItem type="input" label="Input" />
        </SidebarMenu>
        
        <SidebarMenu title="Basic Functions">
          {["grayscale", "blur", "blue", "red", "green", "rotate"].map((fn) => (
            <SidebarItem 
              key={fn} 
              type={`function-${fn}` as NodeType} 
              label={fn.charAt(0).toUpperCase() + fn.slice(1)} 
            />
          ))}
        </SidebarMenu>
        
        <SidebarMenu title="Scientific Functions">
          {["canny", "threshold", "color_quantization", "cartoon", 
            "histogram_equalization", "sharpen", "fourier_transform", 
            "edge_detection", "stylization", "perspective_transform"].map((fn) => (
            <SidebarItem 
              key={fn} 
              type={`function-${fn}` as NodeType} 
              label={fn.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} 
            />
          ))}
        </SidebarMenu>
        
        <SidebarMenu title="Outputs">
          <SidebarItem type="output" label="Output" />
        </SidebarMenu>
      </div>

      {/* Contenuto principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          ref={(el) => {
            reactFlowWrapper.current = el;
            drop(el);
          }}
          onClick={() => setContextNodeId(null)}
          style={{ width: "100%", height: "100%" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={null}
            nodeDragThreshold={15}
            elementsSelectable={true}
            onNodeContextMenu={(e, node) => {
              e.preventDefault();
              setContextNodeId(node.id);
            }}
            onClick={() => setContextNodeId(null)}
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>
      </div>
      {contextNodeId && (
        <div
          style={{
            height: "150px",
            width: "100px",
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1000,
            backgroundColor: "rgb(205, 242, 252)",
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: '12px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexDirection: "column"
          }}
        >
          <Button
            style={{
              backgroundColor: "red",
              border: "none",
              color: "white"
            }}
            danger size="small" onClick={() => {
              setNodes(nds => nds.filter(n => n.id !== contextNodeId));
              setEdges(eds => eds.filter(e => e.source !== contextNodeId && e.target !== contextNodeId));
              setContextNodeId(null);
            }}>
            Delete
          </Button>
          <Button
            style={{
              backgroundColor: "white",
              border: "none",
              color: "black"
            }}
            size="small" onClick={() => setContextNodeId(null)}>
            Cancel
          </Button>
        </div>
      )}
      {infoWidget.show && (
          <InfoWidget
            title={infoWidget.title}
            description={infoWidget.description}
            onClose={() => setInfoWidget(prev => ({ ...prev, show: false }))}
          />
      )}
      {contextNodeId && (
        <div>
          {/* contenuto invariato */}
        </div>
      )}
      {paramsNodeId && (
        <ParamsWidget 
          nodeId={paramsNodeId}
          params={nodes.find(n => n.id === paramsNodeId)?.data.params || {}}
          onClose={() => setParamsNodeId(null)}
          onSave={(params) => handleSaveParams(paramsNodeId, params)}
          functionType={nodes.find(n => n.id === paramsNodeId)?.data.selectedFunction || ''}
        />
      )}
    </div>
    </RunHandlerContext.Provider>
  );
}