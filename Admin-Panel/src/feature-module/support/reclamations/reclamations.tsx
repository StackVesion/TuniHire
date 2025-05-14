import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Table, Modal, Button, Input, Select, message, Pagination, Tooltip } from 'antd';
import { MessageOutlined, EditOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

// Import des styles CSS pour les réclamations
import './reclamations.css';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);
dayjs.locale('fr');

interface Reclamation {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

const Reclamations: React.FC = () => {
  const dispatch = useDispatch();
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalReclamations, setTotalReclamations] = useState<number>(0);
  const [responseModalVisible, setResponseModalVisible] = useState<boolean>(false);
  const [adminResponse, setAdminResponse] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<string>('in_progress');
  const [currentReclamation, setCurrentReclamation] = useState<Reclamation | null>(null);

  // Set page title
  useEffect(() => {
    document.title = 'Réclamations | TuniHire Admin';
    fetchReclamations();
  }, [currentPage, pageSize]);

  // Fonction pour récupérer les informations d'un utilisateur par son ID
  const fetchUserById = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await axios.get(
        `http://localhost:5000/api/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching user with ID ${userId}:`, error);
      return null;
    }
  };

  // Fetch reclamations from API
  const fetchReclamations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(
        `http://localhost:5000/api/reclamations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('API Response:', response.data);
      
      if (response.data) {
        // Vérifier si les données sont un tableau
        const reclamationsData = Array.isArray(response.data) ? response.data : 
                              (response.data.reclamations ? response.data.reclamations : []);
        
        console.log('Reclamations data:', reclamationsData);
        
        // Afficher les informations sur le premier élément pour le débogage
        if (reclamationsData.length > 0) {
          console.log('Premier élément:', reclamationsData[0]);
          console.log('Type de userId:', typeof reclamationsData[0].userId);
          if (reclamationsData[0].userId && typeof reclamationsData[0].userId === 'object') {
            console.log('Propriétés de userId:', Object.keys(reclamationsData[0].userId));
          }
        }
        
        setReclamations(reclamationsData);
        setTotalReclamations(reclamationsData.length);
      } else {
        setReclamations([]);
        setTotalReclamations(0);
      }
    } catch (err: any) {
      console.error('Error fetching reclamations:', err);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        
        if (err.response.status === 401) {
          setError('Session expired. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You do not have permission to view reclamations.');
        } else {
          setError(`Failed to fetch reclamations: ${err.response.data.message || err.message}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response received from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  // Open response modal
  const showResponseModal = (reclamation: Reclamation) => {
    setCurrentReclamation(reclamation);
    setAdminResponse(reclamation.adminResponse || '');
    setResponseStatus(reclamation.status);
    setResponseModalVisible(true);
  };

  // Close response modal
  const handleCancel = () => {
    setResponseModalVisible(false);
    setAdminResponse('');
    setResponseStatus('in_progress');
    setCurrentReclamation(null);
  };

  // Submit admin response
  const handleSubmitResponse = async () => {
    if (!currentReclamation) {
      message.error('No reclamation selected');
      return;
    }
    
    if (!adminResponse.trim()) {
      message.error('Please enter a response');
      return;
    }
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('Authentication token not found. Please log in again.');
        return;
      }
      
      // Prepare request data - ensure values are strings and not empty
      const requestData = {
        adminResponse: adminResponse?.trim() || 'No response provided',
        status: responseStatus || 'in_progress'
      };
      
      console.log('Sending request with data:', JSON.stringify(requestData));
      console.log('Request data type check:', {
        adminResponseType: typeof adminResponse,
        adminResponseValue: adminResponse,
        statusType: typeof responseStatus,
        statusValue: responseStatus
      });
      console.log('To URL:', `http://localhost:5000/api/reclamations/${currentReclamation._id}`);
      console.log('Reclamation ID:', currentReclamation._id);
      
      // Use direct axios call with minimal headers to avoid CORS issues
      const response = await axios({
        method: 'PUT',
        url: `http://localhost:5000/api/reclamations/${currentReclamation._id}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
          // Don't include CORS headers in the client request
          // They should only be set by the server
        },
        data: requestData,
        withCredentials: false
      });
      
      console.log('Response:', response);
      
      if (response.status === 200) {
        message.success('Response submitted successfully');
        setResponseModalVisible(false);
        
        // Update the reclamation in the local state
        setReclamations(prev => 
          prev.map(rec => 
            rec._id === currentReclamation._id 
              ? { 
                  ...rec, 
                  adminResponse, 
                  status: responseStatus,
                  updatedAt: new Date().toISOString() 
                } 
              : rec
          )
        );
      }
    } catch (err: any) {
      console.error('Error submitting response:', err);
      
      // More detailed error logging
      if (err.response) {
        console.log('Error status:', err.response.status);
        console.log('Error data:', err.response.data);
      }
      console.log('Error message:', err.message);
      console.log('Error stack:', err.stack);
      
      // Show appropriate error message based on status code
      if (err.response) {
        switch (err.response.status) {
          case 400:
            message.error(`Bad request: ${err.response.data.message || 'Invalid data provided'}`);
            break;
          case 401:
            message.error('Session expired. Please log in again.');
            break;
          case 403:
            message.error('You do not have permission to update this reclamation.');
            break;
          case 404:
            message.error('Reclamation not found.');
            break;
          case 500:
            message.error('Server error. Please try again later.');
            break;
          default:
            message.error(`Failed to submit response: ${err.response.data.message || err.message}`);
        }
      } else {
        message.error(`Network error: ${err.message}`);
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return dayjs(dateString).fromNow();
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Obtenir le texte du rôle de l'utilisateur
  const getRoleText = (userId: any) => {
    if (userId && typeof userId === 'object' && userId.role) {
      return userId.role.charAt(0).toUpperCase() + userId.role.slice(1);
    }
    return 'Utilisateur';
  };

  // Obtenir la couleur de fond du badge de rôle
  const getRoleBgColor = (userId: any) => {
    if (userId && typeof userId === 'object' && userId.role) {
      switch (userId.role.toLowerCase()) {
        case 'admin':
          return '#f6ffed'; // Vert clair
        case 'entreprise':
          return '#fff2e8'; // Orange clair
        case 'candidat':
          return '#e6f7ff'; // Bleu clair
        default:
          return '#f9f0ff'; // Violet clair
      }
    }
    return '#f0f0f0'; // Gris clair par défaut
  };

  // Obtenir la couleur du texte du badge de rôle
  const getRoleTextColor = (userId: any) => {
    if (userId && typeof userId === 'object' && userId.role) {
      switch (userId.role.toLowerCase()) {
        case 'admin':
          return '#52c41a'; // Vert
        case 'entreprise':
          return '#fa8c16'; // Orange
        case 'candidat':
          return '#1890ff'; // Bleu
        default:
          return '#722ed1'; // Violet
      }
    }
    return '#666666'; // Gris par défaut
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-soft-warning';
      case 'in_progress':
        return 'badge-soft-info';
      case 'resolved':
        return 'badge-soft-success';
      case 'closed':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'resolved':
        return 'Résolu';
      case 'closed':
        return 'Fermé';
      default:
        return status;
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'badge-soft-success';
      case 'medium':
        return 'badge-soft-warning';
      case 'high':
        return 'badge-soft-danger';
      case 'urgent':
        return 'badge-soft-dark';
      default:
        return 'badge-soft-secondary';
    }
  };

  // Get priority text
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Basse';
      case 'medium':
        return 'Moyenne';
      case 'high':
        return 'Haute';
      case 'urgent':
        return 'Urgente';
      default:
        return priority;
    }
  };

  // Get category text
  const getCategoryText = (category: string) => {
    switch (category) {
      case 'technical':
        return 'Technique';
      case 'billing':
        return 'Facturation';
      case 'account':
        return 'Compte';
      case 'job':
        return 'Emploi';
      case 'other':
        return 'Autre';
      default:
        return category;
    }
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      render: (text: string) => <span className="text-primary">#{text.slice(-6)}</span>,
    },
    {
      title: 'Utilisateur',
      dataIndex: 'userId',
      render: (user: Reclamation['userId']) => (
        <div className="table-avatar">
          <Link to={`/admin/profile/${user._id}`} className="avatar avatar-sm me-2">
            <img
              className="avatar-img rounded-circle"
              src={user.profilePicture || '/assets/img/profiles/avatar-02.jpg'}
              alt="User Image"
            />
          </Link>
          <Link to={`/admin/profile/${user._id}`}>
            {user.firstName} {user.lastName}
          </Link>
        </div>
      ),
    },
    {
      title: 'Sujet',
      dataIndex: 'subject',
    },
    {
      title: 'Catégorie',
      dataIndex: 'category',
      render: (text: string) => <span>{getCategoryText(text)}</span>,
    },
    {
      title: 'Priorité',
      dataIndex: 'priority',
      render: (text: string) => (
        <span className={`badge ${getPriorityColor(text)}`}>{getPriorityText(text)}</span>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      render: (text: string) => (
        <span className={`badge ${getStatusColor(text)}`}>{getStatusText(text)}</span>
      ),
    },
    {
      title: 'Créé',
      dataIndex: 'createdAt',
      render: (text: string) => <span>{formatDate(text)}</span>,
    },
    {
      title: 'Action',
      render: (_: any, record: Reclamation) => (
        <div className="dropdown dropdown-action">
          <Button
            type="primary"
            onClick={() => showResponseModal(record)}
            disabled={record.status === 'closed'}
          >
            {record.adminResponse ? 'Modifier réponse' : 'Répondre'}
          </Button>
        </div>
      ),
    },
  ];

  // Table pagination config
  const paginationConfig = {
    total: totalReclamations,
    current: currentPage,
    pageSize: pageSize,
    showSizeChanger: true,
    onChange: handlePageChange,
    onShowSizeChange: (current: number, size: number) => {
      setPageSize(size);
      setCurrentPage(1);
    },
    showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} sur ${total} réclamations`
  };

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <div className="page-header">
          <Row>
            <Col sm={12}>
              <h3 className="page-title">Réclamations</h3>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/admin/index">Dashboard</Link>
                </li>
                <li className="breadcrumb-item active">Réclamations</li>
              </ul>
            </Col>
          </Row>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        
        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="mt-2">Chargement des réclamations...</p>
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]} className="reclamations-container">
              {reclamations.length > 0 ? (
                reclamations.map((reclamation) => (
                  <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={reclamation._id}>
                    <Card 
                      hoverable 
                      className="reclamation-card reclamation-card-hover" 
                      style={{ 
                        height: '100%',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                      }}
                      bodyStyle={{ 
                        padding: '16px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}

                    >
                      <div className="card-status-badges" style={{ 
                        marginBottom: '12px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        <span className={`badge ${getStatusColor(reclamation.status)}`} style={{
                          padding: '5px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          whiteSpace: 'nowrap'
                        }}>
                          {getStatusText(reclamation.status)}
                        </span>
                        <span className={`badge ${getPriorityColor(reclamation.priority)}`} style={{
                          padding: '5px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          whiteSpace: 'nowrap'
                        }}>
                          {getPriorityText(reclamation.priority)}
                        </span>
                      </div>
                      
                      <h5 className="card-title" style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '10px',
                        fontSize: '1rem',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '2.8rem'
                      }}>
                        {reclamation.subject}
                      </h5>
                      
                      <div className="user-info" style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        marginBottom: '15px',
                        padding: '10px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        border: '1px solid #eee'
                      }}>
                        <div 
                          className="user-avatar" 
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '50%', 
                            backgroundColor: '#e6f7ff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginRight: '12px',
                            overflow: 'hidden',
                            border: '2px solid #1890ff',
                            flexShrink: 0
                          }}
                        >
                          {reclamation.userId && reclamation.userId.profilePicture ? (
                            <img 
                              src={reclamation.userId.profilePicture} 
                              alt={`${reclamation.userId && reclamation.userId.firstName || 'Utilisateur'} ${reclamation.userId && reclamation.userId.lastName || ''}`} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#1890ff' }}>
                              {reclamation.userId && reclamation.userId.firstName ? reclamation.userId.firstName.charAt(0).toUpperCase() : 'U'}
                              {reclamation.userId && reclamation.userId.lastName ? reclamation.userId.lastName.charAt(0).toUpperCase() : ''}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: '1', overflow: 'hidden' }}>
                          {/* Affichage du prénom et du rôle de l'utilisateur */}
                          <div style={{ 
                            fontWeight: 'bold', 
                            fontSize: '15px',
                            marginBottom: '5px',
                            color: '#1890ff'
                          }}>
                            {reclamation.userId && typeof reclamation.userId === 'object' && reclamation.userId.firstName ? 
                              reclamation.userId.firstName : 'Utilisateur'}
                          </div>
                          
                          {/* Badge de rôle */}
                          <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <span style={{ 
                              fontSize: '12px', 
                              backgroundColor: getRoleBgColor(reclamation.userId),
                              color: getRoleTextColor(reclamation.userId),
                              padding: '2px 8px', 
                              borderRadius: '12px',
                              fontWeight: '500'
                            }}>
                              {getRoleText(reclamation.userId)}
                            </span>
                          </div>
                          
                          {/* Indication auteur */}
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <span style={{ color: '#52c41a', fontSize: '14px' }}>&#x2022;</span> Auteur de la réclamation
                          </div>
                        </div>
                      </div>
                      
                      <div className="category" style={{ marginBottom: '10px' }}>
                        <strong>Catégorie:</strong> {getCategoryText(reclamation.category)}
                      </div>
                      
                      <div className="description" style={{ 
                        marginBottom: '15px', 
                        maxHeight: '80px', 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        fontSize: '0.9rem',
                        color: '#555',
                        lineHeight: '1.5',
                        flex: '1 1 auto'
                      }}>
                        {reclamation.description}
                      </div>
                      
                      <Tooltip title={reclamation.adminResponse ? 'Voir ou modifier la réponse' : 'Répondre à cette réclamation'}>
                        <Button 
                          type="primary" 
                          onClick={() => showResponseModal(reclamation)}
                          style={{ 
                            width: '100%', 
                            marginBottom: '15px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            height: '40px',
                            fontSize: '14px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                          icon={reclamation.adminResponse ? <EditOutlined /> : <MessageOutlined />}
                        >
                          {reclamation.adminResponse ? 'Voir/Modifier la réponse' : 'Répondre'}
                        </Button>
                      </Tooltip>

                      <div className="date-info" style={{ fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Créé {formatDate(reclamation.createdAt)}</span>
                        {reclamation.adminResponse && (
                          <span>Répondu {formatDate(reclamation.updatedAt)}</span>
                        )}
                      </div>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <div className="text-center p-5">
                    <h4>Aucune réclamation trouvée</h4>
                    <p>Il n'y a pas de réclamations à afficher pour le moment.</p>
                  </div>
                </Col>
              )}
            </Row>
            
            <div className="pagination-container" style={{ 
              marginTop: '30px', 
              display: 'flex', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              padding: '0 10px'
            }}>
              <Pagination 
                {...paginationConfig}
                style={{ margin: '20px 0' }}
                size={window.innerWidth < 768 ? 'small' : 'default'}
                responsive={true}
                showSizeChanger={window.innerWidth >= 576}
              />
            </div>
            
            {/* Les styles sont appliqués directement via les attributs style des composants */}
          </>
        )}

        {/* Response Modal */}
        <Modal
          title="Répondre à la réclamation"
          visible={responseModalVisible}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              Annuler
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleSubmitResponse}
            >
              Envoyer la réponse
            </Button>,
          ]}
          width={700}
        >
          {currentReclamation && (
            <div>
              <div className="reclamation-details mb-4">
                <h4>{currentReclamation.subject}</h4>
                <p className="text-muted">
                  Créé {formatDate(currentReclamation.createdAt)} par{' '}
                  <strong>
                    {currentReclamation.userId && currentReclamation.userId.firstName ? currentReclamation.userId.firstName : 'Utilisateur'} {currentReclamation.userId && currentReclamation.userId.lastName ? currentReclamation.userId.lastName : ''}
                  </strong>
                </p>
                <div className="badge-container mb-2">
                  <span className={`badge ${getPriorityColor(currentReclamation.priority)} me-2`}>
                    {getPriorityText(currentReclamation.priority)}
                  </span>
                  <span className={`badge ${getStatusColor(currentReclamation.status)}`}>
                    {getStatusText(currentReclamation.status)}
                  </span>
                </div>
                <div className="description-box p-3 bg-light rounded mb-3">
                  <p className="mb-0">{currentReclamation.description}</p>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Statut</label>
                <Select
                  style={{ width: '100%' }}
                  value={responseStatus}
                  onChange={(value) => setResponseStatus(value)}
                >
                  <Select.Option value="pending">En attente</Select.Option>
                  <Select.Option value="in_progress">En cours</Select.Option>
                  <Select.Option value="resolved">Résolu</Select.Option>
                  <Select.Option value="closed">Fermé</Select.Option>
                </Select>
              </div>

              <div className="form-group">
                <label>Votre réponse</label>
                <Input.TextArea
                  rows={4}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Entrez votre réponse ici..."
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Reclamations;
