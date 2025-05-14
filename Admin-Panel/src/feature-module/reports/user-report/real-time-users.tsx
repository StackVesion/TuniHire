import React from 'react';
import { Card, Button } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';
import { User } from './types';
import './real-time-users.css';

interface RealTimeUsersProps {
  users: User[];
  lastUpdate: string;
  onRefresh: () => void;
}

const RealTimeUsers: React.FC<RealTimeUsersProps> = ({ users, lastUpdate, onRefresh }) => {
  // Filtrer uniquement les utilisateurs en ligne
  const onlineUsers = users.filter(user => user.isOnline);
  
  // Organiser les utilisateurs par rôle
  const usersByRole = {
    admin: onlineUsers.filter(user => user.role.toLowerCase() === 'admin'),
    hr: onlineUsers.filter(user => user.role.toLowerCase() === 'hr'),
    recruiter: onlineUsers.filter(user => user.role.toLowerCase() === 'recruiter'),
    candidate: onlineUsers.filter(user => user.role.toLowerCase() === 'candidate'),
    other: onlineUsers.filter(user => !['admin', 'hr', 'recruiter', 'candidate'].includes(user.role.toLowerCase()))
  };

  // Fonction pour obtenir la couleur de fond de l'avatar en fonction du rôle
  const getAvatarBgColor = (role: string): string => {
    switch(role.toLowerCase()) {
      case 'admin': return '0D6EFD';
      case 'hr': return 'DC3545';
      case 'recruiter': return '17A2B8';
      case 'candidate': return '28A745';
      default: return '6C757D';
    }
  };

  // Fonction pour obtenir la classe de badge en fonction du rôle
  const getBadgeClass = (role: string): string => {
    switch(role.toLowerCase()) {
      case 'admin': return 'bg-primary';
      case 'hr': return 'bg-danger';
      case 'recruiter': return 'bg-info';
      case 'candidate': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  // Fonction pour obtenir la classe de carte en fonction du rôle
  const getCardClass = (role: string): string => {
    switch(role.toLowerCase()) {
      case 'admin': return 'admin-card';
      case 'hr': return 'hr-card';
      case 'recruiter': return 'recruiter-card';
      case 'candidate': return 'candidate-card';
      default: return '';
    }
  };

  // Fonction pour formater la date de dernière connexion
  const formatLastLogin = (date: string | null | undefined): string => {
    if (!date) return 'N/A';
    
    const loginDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - loginDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    
    return loginDate.toLocaleTimeString();
  };

  return (
    <div className="real-time-users mb-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Utilisateurs connectés en temps réel</h4>
            <p className="text-muted mb-0">Dernière mise à jour: {lastUpdate}</p>
          </div>
          <div>
            <span className="badge bg-success me-2">{onlineUsers.length} utilisateur(s) en ligne</span>
            <Button variant="outline-primary" onClick={onRefresh}>
              <FeatherIcon icon="refresh-cw" size={16} /> Actualiser
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {onlineUsers.length > 0 ? (
            <div>
              {/* Section Administrateurs */}
              {usersByRole.admin.length > 0 && (
                <div className="role-section mb-4">
                  <h5 className="role-title">
                    <span className="badge bg-primary me-2">Administrateurs</span>
                    <span className="badge bg-light text-dark">{usersByRole.admin.length}</span>
                  </h5>
                  <div className="connected-users-grid">
                    {usersByRole.admin.map(user => (
                      <div key={user._id} className={`connected-user-card ${getCardClass(user.role)}`}>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md me-3 position-relative">
                            <img
                              className="avatar-img rounded-circle"
                              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=${getAvatarBgColor(user.role)}&color=fff&size=80`}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                  style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%', border: '2px solid white' }}></span>
                          </div>
                          <div>
                            <h5 className="mb-1">{`${user.firstName} ${user.lastName}`}</h5>
                            <p className="text-muted mb-0 small">{user.email}</p>
                            <div className="mt-1 d-flex align-items-center flex-wrap">
                              <span className="badge bg-primary me-1">{user.role}</span>
                              <span className="badge bg-success me-1">En ligne</span>
                              {user.subscription && (
                                <span className="badge bg-info me-1">{user.subscription}</span>
                              )}
                              <span className="text-muted small d-block mt-1">
                                Connecté depuis: {formatLastLogin(user.lastLogin || user.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section RH */}
              {usersByRole.hr.length > 0 && (
                <div className="role-section mb-4">
                  <h5 className="role-title">
                    <span className="badge bg-danger me-2">Ressources Humaines</span>
                    <span className="badge bg-light text-dark">{usersByRole.hr.length}</span>
                  </h5>
                  <div className="connected-users-grid">
                    {usersByRole.hr.map(user => (
                      <div key={user._id} className={`connected-user-card ${getCardClass(user.role)}`}>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md me-3 position-relative">
                            <img
                              className="avatar-img rounded-circle"
                              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=${getAvatarBgColor(user.role)}&color=fff&size=80`}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                  style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%', border: '2px solid white' }}></span>
                          </div>
                          <div>
                            <h5 className="mb-1">{`${user.firstName} ${user.lastName}`}</h5>
                            <p className="text-muted mb-0 small">{user.email}</p>
                            <div className="mt-1 d-flex align-items-center flex-wrap">
                              <span className="badge bg-danger me-1">{user.role}</span>
                              <span className="badge bg-success me-1">En ligne</span>
                              {user.subscription && (
                                <span className="badge bg-info me-1">{user.subscription}</span>
                              )}
                              <span className="text-muted small d-block mt-1">
                                Connecté depuis: {formatLastLogin(user.lastLogin || user.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Recruteurs */}
              {usersByRole.recruiter.length > 0 && (
                <div className="role-section mb-4">
                  <h5 className="role-title">
                    <span className="badge bg-info me-2">Recruteurs</span>
                    <span className="badge bg-light text-dark">{usersByRole.recruiter.length}</span>
                  </h5>
                  <div className="connected-users-grid">
                    {usersByRole.recruiter.map(user => (
                      <div key={user._id} className={`connected-user-card ${getCardClass(user.role)}`}>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md me-3 position-relative">
                            <img
                              className="avatar-img rounded-circle"
                              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=${getAvatarBgColor(user.role)}&color=fff&size=80`}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                  style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%', border: '2px solid white' }}></span>
                          </div>
                          <div>
                            <h5 className="mb-1">{`${user.firstName} ${user.lastName}`}</h5>
                            <p className="text-muted mb-0 small">{user.email}</p>
                            <div className="mt-1 d-flex align-items-center flex-wrap">
                              <span className="badge bg-info me-1">{user.role}</span>
                              <span className="badge bg-success me-1">En ligne</span>
                              {user.subscription && (
                                <span className="badge bg-info me-1">{user.subscription}</span>
                              )}
                              <span className="text-muted small d-block mt-1">
                                Connecté depuis: {formatLastLogin(user.lastLogin || user.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Candidats */}
              {usersByRole.candidate.length > 0 && (
                <div className="role-section mb-4">
                  <h5 className="role-title">
                    <span className="badge bg-success me-2">Candidats</span>
                    <span className="badge bg-light text-dark">{usersByRole.candidate.length}</span>
                  </h5>
                  <div className="connected-users-grid">
                    {usersByRole.candidate.map(user => (
                      <div key={user._id} className={`connected-user-card ${getCardClass(user.role)}`}>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md me-3 position-relative">
                            <img
                              className="avatar-img rounded-circle"
                              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=${getAvatarBgColor(user.role)}&color=fff&size=80`}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                  style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%', border: '2px solid white' }}></span>
                          </div>
                          <div>
                            <h5 className="mb-1">{`${user.firstName} ${user.lastName}`}</h5>
                            <p className="text-muted mb-0 small">{user.email}</p>
                            <div className="mt-1 d-flex align-items-center flex-wrap">
                              <span className="badge bg-success me-1">{user.role}</span>
                              <span className="badge bg-success me-1">En ligne</span>
                              {user.subscription && (
                                <span className="badge bg-info me-1">{user.subscription}</span>
                              )}
                              <span className="text-muted small d-block mt-1">
                                Connecté depuis: {formatLastLogin(user.lastLogin || user.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Autres rôles */}
              {usersByRole.other.length > 0 && (
                <div className="role-section mb-4">
                  <h5 className="role-title">
                    <span className="badge bg-secondary me-2">Autres rôles</span>
                    <span className="badge bg-light text-dark">{usersByRole.other.length}</span>
                  </h5>
                  <div className="connected-users-grid">
                    {usersByRole.other.map(user => (
                      <div key={user._id} className={`connected-user-card ${getCardClass(user.role)}`}>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md me-3 position-relative">
                            <img
                              className="avatar-img rounded-circle"
                              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=${getAvatarBgColor(user.role)}&color=fff&size=80`}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <span className="position-absolute bottom-0 end-0 user-status-indicator user-status-online" 
                                  style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%', border: '2px solid white' }}></span>
                          </div>
                          <div>
                            <h5 className="mb-1">{`${user.firstName} ${user.lastName}`}</h5>
                            <p className="text-muted mb-0 small">{user.email}</p>
                            <div className="mt-1 d-flex align-items-center flex-wrap">
                              <span className={`badge ${getBadgeClass(user.role)} me-1`}>{user.role}</span>
                              <span className="badge bg-success me-1">En ligne</span>
                              {user.subscription && (
                                <span className="badge bg-info me-1">{user.subscription}</span>
                              )}
                              <span className="text-muted small d-block mt-1">
                                Connecté depuis: {formatLastLogin(user.lastLogin || user.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-4 bg-light rounded">
              <i className="fa fa-users fa-3x text-muted mb-3"></i>
              <h5>Aucun utilisateur connecté actuellement</h5>
              <p className="text-muted">Les utilisateurs en ligne apparaîtront ici</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default RealTimeUsers;
