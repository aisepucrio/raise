package platform

import "fmt"

type Registry struct {
	byID  map[ID]Platform
	order []ID
}

func NewRegistry(platforms ...Platform) (*Registry, error) {
	r := &Registry{byID: map[ID]Platform{}}
	for _, p := range platforms {
		if _, dup := r.byID[p.ID()]; dup {
			return nil, fmt.Errorf("platform %q registered twice", p.ID())
		}
		r.byID[p.ID()] = p
		r.order = append(r.order, p.ID())
	}
	return r, nil
}

func (r *Registry) All() []Platform {
	out := make([]Platform, 0, len(r.order))
	for _, id := range r.order {
		out = append(out, r.byID[id])
	}
	return out
}

func (r *Registry) Get(id ID) (Platform, bool) {
	p, ok := r.byID[id]
	return p, ok
}

func (r *Registry) Credentialed(id ID) (Credentialed, bool) {
	c, ok := r.byID[id].(Credentialed)
	return c, ok
}

func (r *Registry) Source(id ID) (Source, bool) {
	s, ok := r.byID[id].(Source)
	return s, ok
}
