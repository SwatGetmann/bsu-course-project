json.array!(@projects) do |project|
  json.extract! project, :id, :name, :description
  json.url user_url(project, format: :json)
end
