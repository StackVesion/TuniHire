import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Table, Badge, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { SubscriptionPlan, getAllSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from '../../../services/subscriptionService';
import { toast } from 'react-toastify';

const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<Omit<SubscriptionPlan, '_id'>>({
    name: 'Free',
    price: 0,
    features: [],
    duration: 30,
    description: '',
    isPopular: false
  });
  const [deleting, setDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Chargement initial des plans
  useEffect(() => {
    fetchPlans();
  }, []);

  // Récupération des plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllSubscriptionPlans();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors du chargement des plans');
      toast.error('Erreur de chargement des plans d\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  // Gestion du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'features') {
      const featuresArray = value.split('\n').filter(f => f.trim() !== '');
      setFormData({ ...formData, features: featuresArray });
    } else if (name === 'price' || name === 'duration') {
      setFormData({ ...formData, [name]: Number(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Ouverture du modal pour créer un plan
  const handleCreatePlan = () => {
    setModalMode('create');
    setFormData({
      name: 'Free',
      price: 0,
      features: [],
      duration: 30,
      description: '',
      isPopular: false
    });
    setShowModal(true);
  };

  // Ouverture du modal pour éditer un plan
  const handleEditPlan = (plan: SubscriptionPlan) => {
    setModalMode('edit');
    setCurrentPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      features: plan.features,
      duration: plan.duration,
      description: plan.description || '',
      isPopular: plan.isPopular
    });
    setShowModal(true);
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        await createSubscriptionPlan(formData);
        toast.success('Plan d\'abonnement créé avec succès');
      } else if (modalMode === 'edit' && currentPlan?._id) {
        await updateSubscriptionPlan(currentPlan._id, formData);
        toast.success('Plan d\'abonnement mis à jour avec succès');
      }
      
      setShowModal(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue');
    }
  };

  // Affichage du modal de confirmation de suppression
  const confirmDelete = (id: string) => {
    setPlanToDelete(id);
    setShowDeleteModal(true);
  };

  // Suppression d'un plan
  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      setDeleting(true);
      await deleteSubscriptionPlan(planToDelete);
      toast.success('Plan d\'abonnement supprimé avec succès');
      setShowDeleteModal(false);
      setPlanToDelete(null);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // Formatage des features pour l'affichage dans le formulaire
  const formatFeaturesToString = (features: string[]) => {
    return features.join('\n');
  };

  return (
    <div className="subscription-plans mb-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Plans d'abonnement</h5>
          <Button variant="primary" onClick={handleCreatePlan}>
            <i className="ti ti-plus me-1"></i> Ajouter un plan
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des plans d'abonnement...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : plans.length === 0 ? (
            <div className="text-center p-4">
              <i className="ti ti-ticket-off fs-3 text-muted mb-3"></i>
              <p>Aucun plan d'abonnement trouvé</p>
              <Button variant="primary" size="sm" onClick={handleCreatePlan}>
                Créer votre premier plan
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prix</th>
                    <th>Durée</th>
                    <th>Fonctionnalités</th>
                    <th>Status</th>
                    <th>Date de création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan._id}>
                      <td>
                        <span className="fw-medium">{plan.name}</span>
                        {plan.isPopular && (
                          <Badge bg="warning" className="ms-2" pill>Populaire</Badge>
                        )}
                      </td>
                      <td>${plan.price}</td>
                      <td>{plan.duration} jours</td>
                      <td>
                        <ul className="list-unstyled mb-0">
                          {plan.features.slice(0, 2).map((feature, index) => (
                            <li key={index} className="small">
                              <i className="ti ti-check text-success me-1"></i> {feature}
                            </li>
                          ))}
                          {plan.features.length > 2 && (
                            <li className="small text-muted">
                              +{plan.features.length - 2} autres...
                            </li>
                          )}
                        </ul>
                      </td>
                      <td>
                        <Badge bg={plan.price === 0 ? "success" : "primary"}>
                          {plan.price === 0 ? "Gratuit" : "Payant"}
                        </Badge>
                      </td>
                      <td>
                        {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="d-flex">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <i className="ti ti-edit"></i>
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => confirmDelete(plan._id || '')}
                          >
                            <i className="ti ti-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal pour créer/éditer un plan */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Ajouter un plan d\'abonnement' : 'Modifier le plan d\'abonnement'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nom du plan</Form.Label>
              <Form.Select 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange}
                required
              >
                <option value="Free">Free</option>
                <option value="Golden">Golden</option>
                <option value="Platinum">Platinum</option>
                <option value="Master">Master</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Prix</Form.Label>
              <Form.Control 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleInputChange}
                min="0"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Durée (jours)</Form.Label>
              <Form.Control 
                type="number" 
                name="duration" 
                value={formData.duration} 
                onChange={handleInputChange}
                min="1"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Fonctionnalités (une par ligne)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={5} 
                name="features" 
                value={formatFeaturesToString(formData.features)} 
                onChange={handleInputChange}
                placeholder="Exemple: 
10 projets
Stockage illimité
Support par email"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Marquer comme populaire" 
                name="isPopular" 
                checked={formData.isPopular} 
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              {modalMode === 'create' ? 'Créer' : 'Mettre à jour'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Êtes-vous sûr de vouloir supprimer ce plan d'abonnement ? Cette action est irréversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeletePlan}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Suppression...
              </>
            ) : 'Supprimer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SubscriptionPlans; 